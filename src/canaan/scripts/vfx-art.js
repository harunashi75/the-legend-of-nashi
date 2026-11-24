// Effets visuels des sorts et des mécaniques de boss : de vraies matières plutôt que des formes géométriques.
// Le feu est fait de flammes, de braises et de fumée, la glace d'éclats et de brume, la foudre d'éclairs ramifiés, la
// nature de lianes, de racines, de feuilles et de pétales, le sacré de piliers et de runes, le sang de gouttes.
// Chaque effet ({ shape, x, y, a, r, w, c, life, max } : weapon-actions.js, boss-mechanics.js, arena.js) est dessiné
// par sa forme ; start() et tick() émettent ses particules. Les particules ne sont que de l'affichage (rien n'est
// simulé, rien n'est envoyé) : un invité qui reçoit l'effet en fait naître les siennes.
// CANAAN_VFX.draw(ctx, e), start(e), tick(e, dt), step(dt), drawParticles(ctx), isGround(shape), drawMark, drawShield,
// aura, telegraph (annonces des boss), projectile (formes des projectiles).
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const MAX_PARTICLES = 900;
  const parts = [];
  // ---------------------------------------------------------------- Couleurs
  const rgbCache = new Map();
  function rgb(hex) {
    let v = rgbCache.get(hex);
    if (!v) {
      const h = String(hex || '#ffffff').replace('#', ''),
        full =
          h.length === 3
            ? h
                .split('')
                .map(ch => ch + ch)
                .join('')
            : h.padEnd(6, 'f').slice(0, 6),
        n = parseInt(full, 16);
      v = Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
      rgbCache.set(hex, v);
    }
    return v;
  }
  const rgba = (hex, a) => {
    const [r, g, b] = rgb(hex);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  };
  function mix(h1, h2, t) {
    const a = rgb(h1),
      b = rgb(h2);
    return (
      '#' +
      a
        .map((v, i) =>
          Math.round(v + (b[i] - v) * t)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')
    );
  }
  // Élément d'une couleur (les effets de classe passent la couleur de leur élément).
  const ELEMENT_OF = new Map();
  function elementOf(c) {
    if (!ELEMENT_OF.size && typeof ELEMENTS === 'object')
      for (const [k, v] of Object.entries(ELEMENTS)) ELEMENT_OF.set(v.color.toLowerCase(), k);
    return ELEMENT_OF.get(String(c).toLowerCase()) || null;
  }
  // ---------------------------------------------------------------- Hasard reproductible (même dessin chez tous)
  function seedOf(e) {
    if (e.seed === undefined) {
      let h = 2166136261;
      const s = e.shape + ':' + Math.round(e.x) + ':' + Math.round(e.y) + ':' + Math.round(e.a * 100);
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
      e.seed = h >>> 0;
    }
    return e.seed;
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const R = Math.random;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = t => 1 - Math.pow(1 - clamp01(t), 3);

  // ---------------------------------------------------------------- Particules
  // kind : flame, ember, smoke, spark, shard, snow, mist, leaf, petal, spore, drop, feather, note, rune, dust, rock,
  // bubble, wisp, glint, motes.
  function emit(kind, x, y, o = {}) {
    if (parts.length >= MAX_PARTICLES) parts.shift();
    const life = o.life ?? 0.6;
    parts.push({
      kind,
      x,
      y,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      ax: o.ax ?? 0,
      ay: o.ay ?? 0,
      drag: o.drag ?? 0.98,
      life,
      max: life,
      size: o.size ?? 4,
      grow: o.grow ?? 0,
      c: o.c || '#ffffff',
      c2: o.c2 || null,
      rot: o.rot ?? R() * TAU,
      vr: o.vr ?? (R() - 0.5) * 6,
      alpha: o.alpha ?? 1,
      z: o.z ?? 0
    });
  }
  // Gerbe : n particules depuis (x, y), vitesse speed dans un angle (a ± spread).
  function spray(kind, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.a ?? 0) + (o.spread ?? Math.PI) * (R() * 2 - 1),
        sp = (o.speed ?? 80) * (0.4 + R() * 0.8),
        r = (o.radius ?? 0) * Math.sqrt(R());
      emit(kind, x + Math.cos(a) * r, y + Math.sin(a) * r * (o.flat ?? 1), {
        ...o,
        vx: Math.cos(a) * sp + (o.vx ?? 0),
        vy: Math.sin(a) * sp * (o.flat ?? 1) + (o.vy ?? 0),
        size: (o.size ?? 4) * (0.6 + R() * 0.8),
        life: (o.life ?? 0.6) * (0.6 + R() * 0.7)
      });
    }
  }
  function step(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      p.vx = (p.vx + p.ax * dt) * Math.pow(p.drag, dt * 60);
      p.vy = (p.vy + p.ay * dt) * Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.size = Math.max(0.2, p.size + p.grow * dt);
    }
  }
  // Une goutte : ronde en bas, effilée vers le haut (sang, eau, poison).
  function dropShape(c, x, y, s, a) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.beginPath();
    c.moveTo(0, -s * 1.8);
    c.quadraticCurveTo(s, -s * 0.2, 0, s);
    c.quadraticCurveTo(-s, -s * 0.2, 0, -s * 1.8);
    c.fill();
    c.restore();
  }
  function leafShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(-s, 0);
    c.quadraticCurveTo(0, -s * 0.8, s, 0);
    c.quadraticCurveTo(0, s * 0.8, -s, 0);
    c.fill();
    c.globalAlpha *= 0.6;
    c.strokeStyle = 'rgba(30,60,20,0.8)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-s, 0);
    c.lineTo(s, 0);
    c.stroke();
    c.restore();
  }
  function shardShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, -s * 1.6);
    c.lineTo(s * 0.45, 0);
    c.lineTo(0, s * 1.6);
    c.lineTo(-s * 0.45, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, -s * 1.6);
    c.lineTo(0, s * 1.6);
    c.stroke();
    c.restore();
  }
  function featherShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, -s * 1.8);
    c.quadraticCurveTo(s * 0.9, -s * 0.4, 0, s * 1.5);
    c.quadraticCurveTo(-s * 0.9, -s * 0.4, 0, -s * 1.8);
    c.fill();
    c.strokeStyle = 'rgba(80,50,20,0.7)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(0, -s * 1.8);
    c.lineTo(0, s * 1.8);
    c.stroke();
    c.restore();
  }
  function noteShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot * 0.15);
    c.beginPath();
    c.ellipse(-s * 0.4, s * 0.8, s * 0.7, s * 0.5, -0.4, 0, TAU);
    c.fill();
    c.fillRect(s * 0.2, -s * 1.6, s * 0.28, s * 2.4);
    c.beginPath();
    c.moveTo(s * 0.45, -s * 1.6);
    c.quadraticCurveTo(s * 1.4, -s * 1.1, s * 1.1, -s * 0.3);
    c.lineTo(s * 0.45, -s * 0.9);
    c.fill();
    c.restore();
  }
  function starShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? s * 0.28 : s;
      c.lineTo(Math.cos((k / 8) * TAU) * r, Math.sin((k / 8) * TAU) * r);
    }
    c.closePath();
    c.fill();
    c.restore();
  }
  function rockShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(-s, -s * 0.3);
    c.lineTo(-s * 0.3, -s);
    c.lineTo(s * 0.8, -s * 0.6);
    c.lineTo(s, s * 0.4);
    c.lineTo(0, s);
    c.lineTo(-s * 0.8, s * 0.6);
    c.closePath();
    c.fill();
    c.restore();
  }
  // Tache douce (flamme, fumée, brume) : dégradé radial.
  function soft(c, x, y, r, inner, outer) {
    if (!(r > 0.3)) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }
  function drawParticles(c) {
    if (!parts.length) return;
    c.save();
    for (const p of parts) {
      const t = p.life / p.max,
        age = 1 - t,
        s = p.size;
      switch (p.kind) {
        case 'flame': {
          // Cœur blanc-jaune, puis orange, puis rouge sombre qui s'efface : la couleur suit l'âge.
          c.globalCompositeOperation = 'lighter';
          const col =
            age < 0.25 ? mix('#fff6c0', p.c, age / 0.25) : mix(p.c, p.c2 || '#a01808', (age - 0.25) / 0.75);
          c.globalAlpha = p.alpha * Math.min(1, t * 1.6);
          soft(c, p.x, p.y, s * (0.6 + age * 0.8), rgba(col, 0.95), rgba(col, 0));
          break;
        }
        case 'ember':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * t;
          c.strokeStyle = p.c;
          c.lineWidth = Math.max(1, s * 0.5);
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          c.stroke();
          break;
        case 'spark':
        case 'glint':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * t;
          c.strokeStyle = p.c;
          c.lineWidth = p.kind === 'glint' ? 1.4 : Math.max(1, s * 0.4);
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
          c.stroke();
          break;
        case 'smoke':
        case 'dust':
        case 'mist':
          c.globalCompositeOperation = p.kind === 'mist' ? 'lighter' : 'source-over';
          c.globalAlpha =
            p.alpha * (p.kind === 'mist' ? 0.35 : 0.42) * Math.min(1, t * 2) * Math.min(1, age * 6);
          soft(c, p.x, p.y, s, rgba(p.c, 0.9), rgba(p.c, 0));
          break;
        case 'wisp':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * Math.min(1, t * 1.5) * 0.8;
          soft(c, p.x, p.y, s, rgba(p.c, 0.8), rgba(p.c, 0));
          break;
        case 'motes':
        case 'spore':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * Math.min(1, t * 2) * Math.min(1, age * 5);
          soft(c, p.x, p.y, s * 2.2, rgba(p.c, 0.7), rgba(p.c, 0));
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(p.x, p.y, Math.max(0.6, s * 0.4), 0, TAU);
          c.fill();
          break;
        case 'shard':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 2);
          c.fillStyle = p.c;
          shardShape(c, p.x, p.y, s, p.rot);
          break;
        case 'snow':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * t;
          c.fillStyle = p.c;
          starShape(c, p.x, p.y, s, p.rot);
          break;
        case 'leaf':
        case 'petal':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 2);
          c.fillStyle = p.c;
          if (p.kind === 'leaf') leafShape(c, p.x, p.y, s, p.rot);
          else {
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.rot);
            c.beginPath();
            c.ellipse(0, 0, s, s * 0.55 * Math.abs(Math.cos(p.rot * 1.7)) + 0.6, 0, 0, TAU);
            c.fill();
            c.restore();
          }
          break;
        case 'drop':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 2);
          c.fillStyle = p.c;
          dropShape(c, p.x, p.y, s, Math.atan2(p.vy, p.vx) - Math.PI / 2 + Math.PI);
          break;
        case 'feather':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 2);
          c.fillStyle = p.c;
          featherShape(c, p.x, p.y, s, p.rot);
          break;
        case 'note':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 2);
          c.fillStyle = p.c;
          noteShape(c, p.x, p.y, s, p.rot);
          break;
        case 'rune':
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = p.alpha * Math.sin(Math.PI * clamp01(age));
          c.fillStyle = p.c;
          starShape(c, p.x, p.y, s, p.rot);
          break;
        case 'rock':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * Math.min(1, t * 3);
          c.fillStyle = p.c;
          rockShape(c, p.x, p.y, s, p.rot);
          break;
        case 'bubble':
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = p.alpha * t;
          c.strokeStyle = p.c;
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(p.x, p.y, s, 0, TAU);
          c.stroke();
          c.fillStyle = rgba('#ffffff', 0.5);
          c.beginPath();
          c.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.25, 0, TAU);
          c.fill();
          break;
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Émetteurs par élément
  // Explosion de feu : flammes, braises, fumée.
  function fireBurst(x, y, r, n = 26) {
    spray('flame', x, y, n, {
      speed: r * 1.6,
      size: r * 0.32,
      grow: r * 0.2,
      life: 0.55,
      ay: -60,
      c: '#ff8a2a',
      c2: '#7a1408',
      radius: r * 0.3
    });
    spray('ember', x, y, Math.round(n * 0.6), { speed: r * 3, size: 3, life: 0.7, ay: 120, c: '#ffd27a' });
    spray('smoke', x, y - 10, Math.round(n * 0.3), {
      speed: r * 0.5,
      size: r * 0.35,
      grow: r * 0.5,
      life: 1.1,
      ay: -40,
      c: '#3a2a24',
      radius: r * 0.4
    });
  }
  function iceBurst(x, y, r, n = 22) {
    spray('shard', x, y, n, { speed: r * 2.6, size: 5, life: 0.6, c: '#cfeeff', drag: 0.92, vr: 0 });
    spray('mist', x, y, Math.round(n * 0.5), {
      speed: r * 0.8,
      size: r * 0.4,
      grow: r * 0.4,
      life: 0.9,
      c: '#bfeaff',
      radius: r * 0.4
    });
    spray('snow', x, y, Math.round(n * 0.5), { speed: r * 1.2, size: 2.5, life: 1, ay: 20, c: '#ffffff' });
  }
  function lightningBurst(x, y, r, n = 18) {
    spray('spark', x, y, n, { speed: r * 4, size: 3, life: 0.3, c: '#fffbb0', drag: 0.9 });
    spray('wisp', x, y, 4, { speed: r * 0.4, size: r * 0.5, life: 0.25, c: '#f4f07a' });
  }
  function natureBurst(x, y, r, n = 18) {
    spray('leaf', x, y, n, {
      speed: r * 1.6,
      size: 5,
      life: 1,
      ay: 40,
      c: R() < 0.5 ? '#6ec24a' : '#9be36a',
      drag: 0.94
    });
    spray('motes', x, y, Math.round(n * 0.5), { speed: r * 0.8, size: 2, life: 0.9, ay: -30, c: '#b8ff8a' });
  }
  function holyBurst(x, y, r, n = 18) {
    spray('rune', x, y, n, { speed: r * 1.4, size: 5, life: 0.8, ay: -30, c: '#ffe08a', drag: 0.93 });
    spray('motes', x, y, n, { speed: r * 0.8, size: 2, life: 1, ay: -50, c: '#fff4c0', radius: r * 0.6 });
  }
  function shadowBurst(x, y, r, n = 18) {
    spray('smoke', x, y, n, {
      speed: r * 1.2,
      size: r * 0.3,
      grow: r * 0.3,
      life: 0.8,
      c: '#2a1638',
      radius: r * 0.3
    });
    spray('wisp', x, y, Math.round(n * 0.6), { speed: r * 1.6, size: 5, life: 0.6, c: '#b070ff' });
  }
  function bloodBurst(x, y, r, n = 18) {
    spray('drop', x, y, n, { speed: r * 2.2, size: 3, life: 0.7, ay: 380, c: '#b01828', drag: 0.97 });
    spray('wisp', x, y, 4, { speed: r * 0.5, size: r * 0.4, life: 0.4, c: '#e0404f' });
  }
  function poisonBurst(x, y, r, n = 18) {
    spray('bubble', x, y, n, { speed: r * 1.2, size: 3, life: 0.9, ay: -40, c: '#b8f060', radius: r * 0.4 });
    spray('smoke', x, y, Math.round(n * 0.6), {
      speed: r * 0.9,
      size: r * 0.35,
      grow: r * 0.3,
      life: 1,
      c: '#5a8a1a',
      radius: r * 0.4
    });
  }
  function harmonyBurst(x, y, r, n = 12) {
    spray('note', x, y, n, { speed: r * 1.2, size: 5, life: 1, ay: -50, c: '#ff9ad5', drag: 0.95, vr: 1 });
    spray('motes', x, y, n, { speed: r, size: 2, life: 0.8, c: '#ffd0ea' });
  }
  function wildBurst(x, y, r, n = 12) {
    spray('feather', x, y, n, {
      speed: r * 1.3,
      size: 4,
      life: 1.1,
      ay: 50,
      c: '#e8c27a',
      drag: 0.93,
      vr: 3
    });
    spray('dust', x, y, Math.round(n * 0.6), {
      speed: r * 0.7,
      size: r * 0.3,
      grow: r * 0.3,
      life: 0.8,
      c: '#a08460'
    });
  }
  function steelBurst(x, y, r, n = 16) {
    spray('glint', x, y, n, { speed: r * 3.2, size: 2, life: 0.35, c: '#f4f8ff', drag: 0.9 });
    spray('dust', x, y, Math.round(n * 0.5), {
      speed: r * 0.6,
      size: r * 0.25,
      grow: r * 0.3,
      life: 0.7,
      c: '#9a8a7a'
    });
  }
  const BURSTS = {
    fire: fireBurst,
    ice: iceBurst,
    lightning: lightningBurst,
    nature: natureBurst,
    holy: holyBurst,
    shadow: shadowBurst,
    blood: bloodBurst,
    poison: poisonBurst,
    harmony: harmonyBurst,
    wild: wildBurst,
    steel: steelBurst
  };
  function elemBurst(x, y, r, c) {
    const el = elementOf(c);
    (BURSTS[el] || ((xx, yy, rr) => spray('spark', xx, yy, 14, { speed: rr * 2.5, size: 2, life: 0.35, c })))(
      x,
      y,
      r
    );
  }

  // ---------------------------------------------------------------- Dessins communs
  // Éclair ramifié de (x1, y1) à (x2, y2) : il change de forme toutes les 3 images.
  function bolt(c, x1, y1, x2, y2, col, width, seed, branches = 2) {
    const rand = rng(seed + Math.floor(performance.now() / 50)),
      len = Math.hypot(x2 - x1, y2 - y1),
      n = Math.max(4, Math.round(len / 18)),
      nx = -(y2 - y1) / (len || 1),
      ny = (x2 - x1) / (len || 1),
      pts = [[x1, y1]];
    for (let i = 1; i < n; i++) {
      const t = i / n,
        off = (rand() - 0.5) * Math.min(28, len * 0.18);
      pts.push([lerp(x1, x2, t) + nx * off, lerp(y1, y2, t) + ny * off]);
    }
    pts.push([x2, y2]);
    const path = () => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (const [px, py] of pts) c.lineTo(px, py);
    };
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = rgba(col, 0.35);
    c.lineWidth = width * 4;
    path();
    c.stroke();
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = width * 1.6;
    path();
    c.stroke();
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1, width * 0.6);
    path();
    c.stroke();
    // Branches : de petits éclairs qui partent du tronc.
    for (let b = 0; b < branches; b++) {
      const at = pts[1 + Math.floor(rand() * (pts.length - 2))],
        ang = Math.atan2(y2 - y1, x2 - x1) + (rand() - 0.5) * 2.2,
        bl = len * (0.15 + rand() * 0.2);
      let bx = at[0],
        by = at[1];
      c.strokeStyle = rgba(col, 0.75);
      c.lineWidth = Math.max(1, width * 0.7);
      c.beginPath();
      c.moveTo(bx, by);
      for (let k = 0; k < 4; k++) {
        bx += Math.cos(ang + (rand() - 0.5) * 1.2) * (bl / 4);
        by += Math.sin(ang + (rand() - 0.5) * 1.2) * (bl / 4);
        c.lineTo(bx, by);
      }
      c.stroke();
    }
    c.restore();
  }
  // Traînée de lame : un croissant qui balaie l'angle, cœur blanc, tranchant coloré, voile qui s'efface.
  function bladeArc(c, e, opts = {}) {
    const t = e.life / e.max,
      age = 1 - t,
      sweep = ease(age / 0.5),
      a0 = e.a - e.w / 2,
      a1 = a0 + e.w * sweep,
      r = e.r,
      thick = opts.thick ?? 0.32,
      inner = r * (1 - thick * (0.6 + 0.4 * t));
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(e.x, e.y, inner, e.x, e.y, r);
    g.addColorStop(0, rgba(e.c, 0));
    g.addColorStop(0.7, rgba(e.c, 0.55 * t));
    g.addColorStop(1, rgba('#ffffff', 0.95 * t));
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, r, Math.max(a0, a1 - e.w * 0.85), a1);
    c.arc(e.x, e.y, inner, a1, Math.max(a0, a1 - e.w * 0.85), true);
    c.closePath();
    c.fill();
    // Le tranchant : un filet blanc qui suit la pointe.
    c.strokeStyle = rgba('#ffffff', t);
    c.lineWidth = 2 + 2 * t;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(e.x, e.y, r * 0.97, Math.max(a0, a1 - e.w * 0.35), a1);
    c.stroke();
    c.restore();
  }
  // Griffures : trois entailles courbes parallèles.
  function clawMarks(c, x, y, a, size, col, t, flip = 1) {
    c.save();
    c.translate(x, y);
    c.rotate(a + flip * 0.5);
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    const grow = ease((1 - t) / 0.4);
    for (let k = -1; k <= 1; k++) {
      const off = k * size * 0.28;
      c.strokeStyle = rgba(col, 0.55 * t);
      c.lineWidth = 7 * t + 1;
      c.beginPath();
      c.moveTo(-size * 0.6, off - size * 0.2);
      c.quadraticCurveTo(0, off + size * 0.15, size * 0.6 * (grow * 2 - 1), off - size * 0.2);
      c.stroke();
      c.strokeStyle = rgba('#ffffff', t);
      c.lineWidth = 2;
      c.stroke();
    }
    c.restore();
  }
  // Fleur de lumière (Floraison) : pétales qui s'ouvrent.
  function flower(c, x, y, r, open, col, spin) {
    c.save();
    c.translate(x, y);
    c.scale(1, 0.55);
    c.rotate(spin);
    for (let layer = 0; layer < 2; layer++)
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + layer * 0.39,
          len = r * (0.55 + layer * 0.25) * open;
        c.fillStyle = layer ? rgba(col, 0.22) : rgba(mix(col, '#ffffff', 0.35), 0.16);
        c.beginPath();
        c.ellipse(Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, len * 0.5, len * 0.18, a, 0, TAU);
        c.fill();
      }
    soft(c, 0, 0, r * 0.35 * open, rgba('#fff7c0', 0.9), rgba('#fff7c0', 0));
    c.restore();
  }
  // Racine épineuse qui jaillit du sol : un pic courbe, sombre, avec ses épines.
  function rootSpike(c, x, y, h, lean, t, col) {
    c.save();
    c.translate(x, y);
    const up = h * (t < 0.25 ? ease(t / 0.25) : t > 0.75 ? 1 - ease((t - 0.75) / 0.25) : 1);
    c.fillStyle = '#4a3220';
    c.strokeStyle = '#2a1a10';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-7, 0);
    c.quadraticCurveTo(-4 + lean * up * 0.2, -up * 0.6, lean * up * 0.4, -up);
    c.quadraticCurveTo(4 + lean * up * 0.2, -up * 0.5, 7, 0);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = col;
    for (let k = 1; k <= 3; k++) {
      const yy = -up * (k / 4),
        xx = lean * up * 0.1 * k;
      c.beginPath();
      c.moveTo(xx + 3, yy);
      c.lineTo(xx + 9, yy - 4);
      c.lineTo(xx + 3, yy - 3);
      c.fill();
      c.beginPath();
      c.moveTo(xx - 3, yy - 2);
      c.lineTo(xx - 9, yy - 6);
      c.lineTo(xx - 3, yy - 5);
      c.fill();
    }
    c.restore();
  }
  // Silhouette du faucon spectral, ailes battantes.
  function hawkShape(c, x, y, a, s, flap, col) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.globalCompositeOperation = 'lighter';
    soft(c, 0, 0, s * 1.6, rgba(col, 0.45), rgba(col, 0));
    c.fillStyle = rgba('#fff3d0', 0.95);
    const wing = s * (0.6 + 0.4 * Math.sin(flap));
    c.beginPath();
    c.moveTo(s * 0.9, 0);
    c.quadraticCurveTo(0, -wing * 1.5, -s * 0.4, -wing * 1.6);
    c.lineTo(-s * 0.1, -s * 0.15);
    c.lineTo(-s, 0);
    c.lineTo(-s * 0.1, s * 0.15);
    c.lineTo(-s * 0.4, wing * 1.6);
    c.quadraticCurveTo(0, wing * 1.5, s * 0.9, 0);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(s * 0.9, 0);
    c.lineTo(s * 1.2, -s * 0.08);
    c.lineTo(s * 1.2, s * 0.08);
    c.fill();
    c.restore();
  }
  function hammerShape(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = '#fff3c0';
    c.strokeStyle = '#c8962c';
    c.lineWidth = 3;
    c.fillRect(-s * 0.12, -s * 1.3, s * 0.24, s * 1.4);
    c.strokeRect(-s * 0.12, -s * 1.3, s * 0.24, s * 1.4);
    c.beginPath();
    c.roundRect?.(-s * 0.7, -s * 0.15, s * 1.4, s * 0.6, 6);
    if (!c.roundRect) c.rect(-s * 0.7, -s * 0.15, s * 1.4, s * 0.6);
    c.fill();
    c.stroke();
    c.fillStyle = '#ffe08a';
    c.fillRect(-s * 0.7, s * 0.05, s * 1.4, s * 0.12);
    c.restore();
  }
  // Cercle runique au sol (sacré, annonces de boss).
  function runeCircle(c, x, y, r, col, spin, alpha) {
    c.save();
    c.translate(x, y);
    c.scale(1, 0.55);
    c.globalAlpha *= alpha;
    c.strokeStyle = col;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.stroke();
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, r * 0.82, 0, TAU);
    c.stroke();
    c.rotate(spin);
    c.fillStyle = col;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      c.save();
      c.translate(Math.cos(a) * r * 0.91, Math.sin(a) * r * 0.91);
      c.rotate(a);
      c.fillRect(-1, -4, 2, 8);
      c.fillRect(-3, -1, 6, 2);
      c.restore();
    }
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    }
    c.closePath();
    c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- Effets : naissance (start) et vie (tick)
  const GROUND = new Set([
    'bloom',
    'spores',
    'consecrated',
    'burnGround',
    'iceGround',
    'bloodPool',
    'crater',
    'rainMark',
    'symphony',
    'poisonPool',
    'fireGround',
    'voidPool',
    'tele'
  ]);
  // Particules à la naissance d'un effet.
  function start(e) {
    const { x, y, a, r, c } = e;
    seedOf(e);
    switch (e.shape) {
      case 'spark':
        spray('spark', x, y, 6, { speed: 220, size: 2.5, life: 0.22, c, drag: 0.9 });
        break;
      case 'arc':
      case 'twinSlash':
      case 'daggerSlash':
      case 'heavySlash':
      case 'crossSlash':
      case 'holySmite':
      case 'maceSmash':
        for (let k = 0; k < 8; k++) {
          const ang = a - e.w / 2 + e.w * R(),
            d = r * (0.7 + R() * 0.3);
          emit('glint', x + Math.cos(ang) * d, y + Math.sin(ang) * d, {
            vx: Math.cos(ang + Math.PI / 2) * 160,
            vy: Math.sin(ang + Math.PI / 2) * 160,
            life: 0.25,
            c: e.shape === 'holySmite' ? '#fff0a0' : '#ffffff'
          });
        }
        if (e.shape === 'holySmite') holyBurst(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, 30, 10);
        if (e.shape === 'maceSmash' || e.shape === 'heavySlash')
          spray('dust', x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7 + 8, 6, {
            speed: 60,
            size: 14,
            grow: 20,
            life: 0.6,
            c: '#8a7458'
          });
        break;
      case 'claws':
      case 'bite':
        if (e.shape === 'bite') bloodBurst(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, 24, 10);
        spray('leaf', x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, 3, {
          speed: 90,
          size: 4,
          life: 0.7,
          ay: 60,
          c: '#8bd45a'
        });
        break;
      case 'ring':
      case 'elemBurst':
      case 'groundSmash':
      case 'pounceLand':
        elemBurst(x, y, Math.min(r, 140) * 0.6, c);
        if (e.shape !== 'elemBurst') {
          spray('dust', x, y + 10, 12, {
            speed: r * 1.2,
            size: 16,
            grow: 26,
            life: 0.8,
            c: '#8a7458',
            flat: 0.5
          });
          if (e.shape === 'groundSmash')
            spray('rock', x, y, 10, { speed: r * 2, size: 4, life: 0.8, ay: 500, vy: -160, c: '#6a5a4a' });
        }
        break;
      case 'flames':
        fireBurst(x, y, r, 46);
        break;
      case 'frostNova':
        for (let k = 0; k < 36; k++) {
          const ang = (k / 36) * TAU;
          emit('shard', x + Math.cos(ang) * 10, y + Math.sin(ang) * 6, {
            vx: Math.cos(ang) * r * 2.4,
            vy: Math.sin(ang) * r * 1.4,
            drag: 0.9,
            life: 0.55,
            size: 6,
            rot: ang + Math.PI / 2,
            vr: 0,
            c: '#d8f4ff'
          });
        }
        iceBurst(x, y, r * 0.5, 20);
        break;
      case 'shatter':
        iceBurst(x, y, r, 30);
        break;
      case 'lightning':
        lightningBurst(x + Math.cos(a) * r, y + Math.sin(a) * r, 30, 14);
        break;
      case 'skybolt':
        lightningBurst(x, y, 50, 20);
        break;
      case 'bloodSplash':
      case 'bloodBurst':
        bloodBurst(x, y, r, 24);
        break;
      case 'bleedDrip':
        spray('drop', x, y, 3, {
          speed: 40,
          a: Math.PI / 2,
          spread: 0.6,
          size: 2.5,
          life: 0.5,
          ay: 300,
          c: '#b01828'
        });
        break;
      case 'poisonBurst':
        poisonBurst(x, y, Math.min(r, 160), 30);
        break;
      case 'shadowStep':
        shadowBurst(x, y, r, 26);
        break;
      case 'roar':
        spray('dust', x, y + 10, 14, {
          speed: r * 1.1,
          size: 14,
          grow: 24,
          life: 0.7,
          c: '#9a8a6a',
          flat: 0.5
        });
        break;
      case 'shapeshift':
        natureBurst(x, y, r, 30);
        break;
      case 'holyPillar':
        holyBurst(x, y, Math.min(r, 120), 26);
        break;
      case 'elemAvatar':
        fireBurst(x, y, 40, 14);
        iceBurst(x, y, 40, 10);
        lightningBurst(x, y, 40, 10);
        break;
      case 'hawkEye':
        wildBurst(x, y, 50, 18);
        break;
      case 'ironWill':
        steelBurst(x, y, Math.min(r, 120), 26);
        break;
      case 'barkSkin':
        spray('leaf', x, y, 14, { speed: 80, size: 5, life: 1, c: '#8a6a3a' });
        break;
      case 'frostTrap':
        iceBurst(x, y, 40, 22);
        break;
      case 'petals':
      case 'finale':
        spray('petal', x, y, 30, {
          speed: r * 1.2,
          size: 4,
          life: 1.4,
          ay: 30,
          c: '#ffc8e8',
          drag: 0.95,
          flat: 0.6
        });
        if (e.shape === 'finale') harmonyBurst(x, y, r, 24);
        break;
      case 'healSong':
      case 'soundwave':
        harmonyBurst(x, y, Math.min(r, 150), e.shape === 'healSong' ? 18 : 6);
        break;
      case 'markCast':
        wildBurst(x, y, 30, 8);
        break;
      case 'chargeTrail':
      case 'dashTrail':
      case 'pounceTrail':
      case 'leapTrail':
      case 'shadowTrail':
        for (let k = 0; k < 12; k++) {
          const d = R() * r;
          emit(e.shape === 'shadowTrail' ? 'smoke' : 'dust', x + Math.cos(a) * d, y + Math.sin(a) * d + 8, {
            vx: (R() - 0.5) * 30,
            vy: -20 * R(),
            size: 12,
            grow: 20,
            life: 0.6,
            c: e.shape === 'shadowTrail' ? '#2a1638' : '#8a7458'
          });
        }
        break;
      case 'muzzle':
        spray('spark', x + Math.cos(a) * 20, y + Math.sin(a) * 20, 4, {
          a,
          spread: 0.5,
          speed: 200,
          size: 2,
          life: 0.18,
          c
        });
        break;
      case 'crater':
        spray('smoke', x, y, 10, {
          speed: r * 0.5,
          size: r * 0.4,
          grow: r * 0.4,
          life: 1.6,
          ay: -30,
          c: '#2a2220',
          radius: r * 0.5
        });
        break;
    }
  }
  // Vie d'un effet : particules continues (sols, nuages, flammes) ; dt en secondes.
  function tick(e, dt) {
    const { x, y, r } = e,
      t = e.life / e.max;
    const chance = rate => R() < rate * dt;
    switch (e.shape) {
      case 'bloom':
        if (chance(10))
          emit('petal', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r * 0.8, {
            vy: -30 - R() * 20,
            vx: (R() - 0.5) * 20,
            ay: -8,
            life: 1.6,
            size: 3.5,
            c: R() < 0.5 ? '#ffc8e8' : '#fff0f8'
          });
        if (chance(14))
          emit('motes', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r * 0.8, {
            vy: -40,
            life: 1.2,
            size: 2,
            c: '#c8ff9a'
          });
        break;
      case 'spores':
        if (chance(16))
          emit('smoke', x + (R() - 0.5) * r * 1.5, y + (R() - 0.5) * r * 0.9, {
            vx: (R() - 0.5) * 16,
            vy: -10,
            size: r * 0.35,
            grow: 12,
            life: 1.6,
            c: R() < 0.5 ? '#7aa82a' : '#a8c84a'
          });
        if (chance(20))
          emit('spore', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r, {
            vx: (R() - 0.5) * 20,
            vy: -14 - R() * 10,
            life: 1.4,
            size: 1.8,
            c: '#e8ff7a'
          });
        break;
      case 'consecrated':
        if (chance(18))
          emit('motes', x + (R() - 0.5) * r * 1.7, y + (R() - 0.5) * r * 0.9, {
            vy: -50 - R() * 30,
            life: 1.2,
            size: 2.2,
            c: '#ffe08a'
          });
        if (chance(4))
          emit('rune', x + (R() - 0.5) * r * 1.4, y + (R() - 0.5) * r * 0.7, {
            vy: -30,
            life: 1,
            size: 5,
            c: '#fff4c0'
          });
        break;
      case 'burnGround':
      case 'fireGround':
        if (chance(26))
          emit('flame', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r * 0.9, {
            vy: -50 - R() * 30,
            life: 0.6,
            size: 7 + R() * 7,
            grow: 6,
            c: '#ff8a2a',
            c2: '#801808'
          });
        if (chance(10))
          emit('ember', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r * 0.9, {
            vy: -90,
            vx: (R() - 0.5) * 40,
            life: 0.8,
            size: 2.5,
            c: '#ffd27a'
          });
        if (chance(5))
          emit('smoke', x + (R() - 0.5) * r, y - 10, {
            vy: -30,
            size: 14,
            grow: 18,
            life: 1.4,
            c: '#2a2220'
          });
        break;
      case 'iceGround':
        if (chance(10))
          emit('mist', x + (R() - 0.5) * r * 1.6, y + (R() - 0.5) * r * 0.8, {
            vx: (R() - 0.5) * 10,
            vy: -6,
            size: 18,
            grow: 10,
            life: 1.6,
            c: '#cfeeff'
          });
        if (chance(8))
          emit('snow', x + (R() - 0.5) * r * 1.6, y - 30 - R() * 30, {
            vy: 30,
            vx: (R() - 0.5) * 10,
            life: 1.2,
            size: 2,
            c: '#ffffff'
          });
        break;
      case 'bloodPool':
        if (chance(6))
          emit('bubble', x + (R() - 0.5) * r * 1.4, y + (R() - 0.5) * r * 0.7, {
            vy: -6,
            life: 0.7,
            size: 2 + R() * 2,
            c: '#e05060'
          });
        break;
      case 'poisonPool':
        if (chance(10))
          emit('bubble', x + (R() - 0.5) * r * 1.4, y + (R() - 0.5) * r * 0.7, {
            vy: -10,
            life: 0.9,
            size: 2 + R() * 3,
            c: '#b8f060'
          });
        if (chance(6))
          emit('smoke', x + (R() - 0.5) * r * 1.2, y, {
            vy: -18,
            size: 14,
            grow: 14,
            life: 1.4,
            c: '#5a8a1a'
          });
        break;
      case 'voidPool':
        if (chance(10))
          emit('wisp', x + (R() - 0.5) * r * 1.4, y + (R() - 0.5) * r * 0.7, {
            vy: -26,
            life: 1,
            size: 5,
            c: '#9a5aff'
          });
        break;
      case 'rooted':
        if (chance(3)) emit('leaf', x + (R() - 0.5) * 20, y, { vy: -20, life: 0.8, size: 3, c: '#6ec24a' });
        break;
      case 'frozen':
        if (chance(4))
          emit('snow', x + (R() - 0.5) * 24, y - 20 - R() * 20, { vy: 20, life: 0.8, size: 2, c: '#ffffff' });
        break;
      case 'meteor':
        // La traînée du météore qui tombe.
        if (t > 0.05) {
          const k = 1 - t,
            mx = x - 220 * (1 - k),
            my = y - 380 * (1 - k);
          emit('flame', mx, my, {
            vx: 60,
            vy: -40,
            life: 0.4,
            size: 16,
            grow: 10,
            c: '#ff8a2a',
            c2: '#601008'
          });
          emit('smoke', mx - 10, my - 10, { vx: -20, vy: -30, life: 0.9, size: 12, grow: 20, c: '#3a2a24' });
        }
        break;
      case 'arrowRain':
        break;
      case 'aegisWall':
        if (chance(10))
          emit('rune', x + (R() - 0.5) * r * 1.4, y - R() * 40, {
            vy: -30,
            life: 0.9,
            size: 4,
            c: '#ffe8a0'
          });
        break;
    }
  }

  // ---------------------------------------------------------------- Effets : dessin
  function draw(c, e) {
    const t = Math.max(0, e.life / e.max),
      age = 1 - t,
      { x, y, a, r } = e,
      col = e.c,
      now = performance.now() / 1000;
    c.save();
    c.lineCap = 'round';
    switch (e.shape) {
      // ------------------------------------------------ Tailles et coups
      case 'arc':
      case 'twinSlash':
      case 'daggerSlash':
      case 'phantomSlash':
      case 'heavySlash':
      case 'holySmite':
      case 'maceSmash':
        if (e.shape === 'phantomSlash') c.globalAlpha = 0.5;
        bladeArc(c, e, { thick: e.shape === 'heavySlash' ? 0.42 : e.shape === 'daggerSlash' ? 0.2 : 0.3 });
        if (e.shape === 'twinSlash')
          bladeArc(c, { ...e, a: e.a + 0.28, life: e.life * 0.85 }, { thick: 0.22 });
        if (e.shape === 'holySmite' && age < 0.5) {
          c.globalCompositeOperation = 'lighter';
          soft(
            c,
            x + Math.cos(a) * r * 0.7,
            y + Math.sin(a) * r * 0.7,
            40 * t,
            rgba('#fff4c0', 0.8),
            rgba('#ffd76a', 0)
          );
        }
        if (e.shape === 'maceSmash' && age < 0.4) {
          c.globalCompositeOperation = 'lighter';
          soft(
            c,
            x + Math.cos(a) * r * 0.75,
            y + Math.sin(a) * r * 0.75,
            30 * t,
            rgba('#ffffff', 0.7),
            rgba(col, 0)
          );
        }
        break;
      case 'crossSlash': {
        // Deux lames qui se croisent en X devant le héros.
        const cx = x + Math.cos(a) * r * 0.55,
          cy = y + Math.sin(a) * r * 0.55,
          L = r * 0.75;
        c.globalCompositeOperation = 'lighter';
        for (const [k, tilt] of [
          [0, 0.75],
          [1, -0.75]
        ]) {
          const grow = ease((age - k * 0.12) / 0.3);
          if (grow <= 0) continue;
          const ang = a + tilt + Math.PI / 2,
            dx = Math.cos(ang) * L,
            dy = Math.sin(ang) * L;
          c.strokeStyle = rgba(col, 0.6 * t);
          c.lineWidth = 12 * t + 2;
          c.beginPath();
          c.moveTo(cx - dx, cy - dy);
          c.lineTo(cx - dx + dx * 2 * grow, cy - dy + dy * 2 * grow);
          c.stroke();
          c.strokeStyle = rgba('#ffffff', t);
          c.lineWidth = 3;
          c.stroke();
        }
        if (age < 0.4) soft(c, cx, cy, 36 * t, rgba('#ffffff', 0.7), rgba(col, 0));
        break;
      }
      case 'cross':
        // Ancienne croix (compatibilité) : même dessin que crossSlash centré sur le point.
        draw(c, { ...e, shape: 'crossSlash', x: x - Math.cos(a) * r * 0.55, y: y - Math.sin(a) * r * 0.55 });
        break;
      case 'claws':
        clawMarks(
          c,
          x + Math.cos(a) * r * 0.62,
          y + Math.sin(a) * r * 0.62,
          a,
          r * 0.75,
          '#d8ff9a',
          t,
          Math.sin(e.seed || 1) > 0 ? 1 : -1
        );
        break;
      case 'bite': {
        // Mâchoires de lumière qui se referment.
        const cx = x + Math.cos(a) * r * 0.6,
          cy = y + Math.sin(a) * r * 0.6,
          close = ease(age / 0.35),
          gap = 22 * (1 - close) + 2;
        c.translate(cx, cy);
        c.rotate(a);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba('#ffffff', 0.9 * t);
        for (const s of [-1, 1])
          for (let k = -2; k <= 2; k++) {
            c.beginPath();
            c.moveTo(k * 7 - 3, s * gap);
            c.lineTo(k * 7, s * (gap - 12));
            c.lineTo(k * 7 + 3, s * gap);
            c.fill();
          }
        c.strokeStyle = rgba(col, 0.7 * t);
        c.lineWidth = 4;
        for (const s of [-1, 1]) {
          c.beginPath();
          c.arc(0, s * (gap + 14), 22, s > 0 ? -2.6 : 0.5, s > 0 ? -0.5 : 2.6);
          c.stroke();
        }
        break;
      }
      case 'stab': {
        c.translate(x, y);
        c.rotate(a);
        c.globalCompositeOperation = 'lighter';
        const len = r * ease(age / 0.25);
        const g = c.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(1, rgba('#ffffff', t));
        c.strokeStyle = g;
        c.lineWidth = 5 * t + 1;
        c.beginPath();
        c.moveTo(len * 0.2, 0);
        c.lineTo(len, 0);
        c.stroke();
        break;
      }
      case 'thrust':
        draw(c, { ...e, shape: 'stab' });
        break;
      case 'shieldBash': {
        // L'écu frappe : sa silhouette dorée et des lignes de choc.
        const cx = x + Math.cos(a) * r * 0.55,
          cy = y + Math.sin(a) * r * 0.55;
        c.translate(cx, cy);
        c.rotate(a);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba('#ffe4a2', 0.6 * t);
        c.beginPath();
        c.moveTo(-6, -20);
        c.quadraticCurveTo(10, -18, 12, 0);
        c.quadraticCurveTo(10, 18, -6, 20);
        c.quadraticCurveTo(0, 0, -6, -20);
        c.fill();
        c.strokeStyle = rgba('#ffffff', t);
        c.lineWidth = 2;
        for (let k = -2; k <= 2; k++) {
          c.beginPath();
          c.moveTo(16, k * 8);
          c.lineTo(16 + 24 * ease(age / 0.3), k * 10);
          c.stroke();
        }
        break;
      }
      case 'whirl':
      case 'bladeStorm': {
        // Lames qui tournent : arcs flous autour du héros.
        c.globalCompositeOperation = 'lighter';
        const spin = now * 14 + (e.seed % 7);
        for (let k = 0; k < (e.shape === 'bladeStorm' ? 3 : 2); k++) {
          const a0 = spin + (k * TAU) / (e.shape === 'bladeStorm' ? 3 : 2);
          const g = c.createRadialGradient(x, y, r * 0.5, x, y, r);
          g.addColorStop(0, rgba(col, 0));
          g.addColorStop(1, rgba('#ffffff', 0.85 * t));
          c.fillStyle = g;
          c.beginPath();
          c.arc(x, y, r, a0, a0 + 1.4);
          c.arc(x, y, r * 0.7, a0 + 1.4, a0, true);
          c.closePath();
          c.fill();
        }
        c.strokeStyle = rgba(col, 0.25 * t);
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(x, y + 6, r, r * 0.5, 0, 0, TAU);
        c.stroke();
        break;
      }
      case 'slam': {
        // Fracas : fissures qui courent dans le cône.
        const grow = Math.min(1, age / 0.35);
        c.globalAlpha = 0.9 * t;
        c.strokeStyle = '#2a1a10';
        c.lineWidth = 3;
        for (let k = 0; k < 7; k++) {
          const base = a - e.w / 2 + (e.w * (k + 0.5)) / 7,
            len = r * (0.65 + 0.35 * ((k * 37) % 10) * 0.1) * grow;
          c.beginPath();
          c.moveTo(x + Math.cos(base) * 18, y + Math.sin(base) * 18);
          for (let s = 1; s <= 4; s++) {
            const d = 18 + ((len - 18) * s) / 4,
              j = base + (((k + s) % 2 ? 1 : -1) * 0.12) / s;
            c.lineTo(x + Math.cos(j) * d, y + Math.sin(j) * d);
          }
          c.stroke();
        }
        c.strokeStyle = rgba(col, 0.6 * t);
        c.lineWidth = 1.2;
        c.stroke();
        break;
      }
      // ------------------------------------------------ Ondes et explosions
      case 'ring':
      case 'elemBurst':
      case 'pounceLand':
      case 'groundSmash': {
        // Onde de l'élément : un anneau de matière (flammes, givre, lumière…) qui s'élargit au ras du sol.
        const el = elementOf(col),
          rr = r * (0.25 + 0.75 * ease(age / 0.6));
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = t;
        const g = c.createRadialGradient(x, y, rr * 0.55, x, y, rr);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(0.75, rgba(col, 0.35));
        g.addColorStop(1, rgba('#ffffff', 0.5));
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU);
        c.fill();
        if (el === 'lightning' && age < 0.5) {
          const rand = rng(e.seed);
          for (let k = 0; k < 4; k++) {
            const ang = rand() * TAU;
            bolt(c, x, y, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * 0.6, col, 1.5, e.seed + k, 0);
          }
        }
        if (e.shape === 'groundSmash' || e.shape === 'pounceLand')
          draw(c, { ...e, shape: 'slam', w: TAU, c: col });
        break;
      }
      case 'flames': {
        // Explosion : boule de feu qui gonfle et une onde de chaleur.
        c.globalCompositeOperation = 'lighter';
        const fr = r * ease(age / 0.3) * (1 - age * 0.3);
        soft(c, x, y, fr, rgba('#fff6c0', 0.9 * t), rgba('#ff5a10', 0));
        c.strokeStyle = rgba('#ffb060', 0.5 * t);
        c.lineWidth = 6 * t;
        c.beginPath();
        c.ellipse(x, y, r * ease(age / 0.5) * 1.1, r * ease(age / 0.5) * 0.65, 0, 0, TAU);
        c.stroke();
        break;
      }
      case 'frostNova': {
        c.globalCompositeOperation = 'lighter';
        const rr = r * ease(age / 0.5);
        c.globalAlpha = t;
        const g = c.createRadialGradient(x, y, rr * 0.3, x, y, rr);
        g.addColorStop(0, rgba('#bfeaff', 0));
        g.addColorStop(0.8, rgba('#bfeaff', 0.3));
        g.addColorStop(1, rgba('#ffffff', 0.7));
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU);
        c.fill();
        break;
      }
      case 'shatter':
        c.globalCompositeOperation = 'lighter';
        soft(c, x, y, r * 0.6 * t, rgba('#ffffff', 0.8), rgba('#bfeaff', 0));
        break;
      case 'soundwave':
      case 'healSong':
      case 'finale': {
        // Ondes sonores : trois anneaux qui vibrent.
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const p = clamp01(age * 1.4 - k * 0.18),
            rr = r * ease(p);
          if (p <= 0 || p >= 1) continue;
          c.strokeStyle = rgba(col, (1 - p) * 0.8);
          c.lineWidth = 3;
          c.beginPath();
          for (let s = 0; s <= 48; s++) {
            const ang = (s / 48) * TAU,
              wob = 1 + 0.04 * Math.sin(ang * 8 + now * 20);
            c.lineTo(x + Math.cos(ang) * rr * wob, y + Math.sin(ang) * rr * 0.6 * wob);
          }
          c.stroke();
        }
        break;
      }
      case 'roar': {
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const p = clamp01(age * 1.5 - k * 0.2);
          if (p <= 0 || p >= 1) continue;
          c.strokeStyle = rgba(col, (1 - p) * 0.7);
          c.lineWidth = 4 * (1 - p) + 1;
          c.beginPath();
          c.ellipse(x, y - 10, r * p, r * p * 0.6, 0, 0, TAU);
          c.stroke();
        }
        break;
      }
      // ------------------------------------------------ Rayons, éclairs, ruées
      case 'beam':
      case 'vineLash': {
        if (e.shape === 'vineLash') {
          // Liane épineuse qui se déroule le long de la ligne et ondule.
          const len = r * ease(age / 0.3),
            wave = Math.sin(now * 18) * 6 * t;
          c.translate(x, y);
          c.rotate(a);
          c.strokeStyle = '#3e6a22';
          c.lineWidth = 7 * t + 2;
          c.beginPath();
          c.moveTo(0, 0);
          for (let s = 0; s <= 20; s++) {
            const px = (len * s) / 20;
            c.lineTo(px, Math.sin(s * 0.9 + now * 10) * wave);
          }
          c.stroke();
          c.strokeStyle = '#8bd45a';
          c.lineWidth = 3 * t + 1;
          c.stroke();
          c.fillStyle = '#d8f0a0';
          for (let s = 1; s < 10; s++) {
            const px = (len * s) / 10,
              py = Math.sin(s * 1.8 + now * 10) * wave,
              side = s % 2 ? 1 : -1;
            c.beginPath();
            c.moveTo(px - 3, py);
            c.lineTo(px, py + side * 9);
            c.lineTo(px + 3, py);
            c.fill();
          }
          break;
        }
        c.translate(x, y);
        c.rotate(a);
        c.globalCompositeOperation = 'lighter';
        const w = Math.max(2, e.w) * (0.4 + 0.6 * t);
        const g = c.createLinearGradient(0, -w, 0, w);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(0.5, rgba('#ffffff', 0.9 * t));
        g.addColorStop(1, rgba(col, 0));
        c.fillStyle = g;
        c.fillRect(0, -w, r, w * 2);
        break;
      }
      case 'lightning':
        bolt(c, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, col, 3 * t + 1, e.seed, 2);
        break;
      case 'skybolt':
        bolt(c, x + 30, y - 420, x, y, col, 4 * t + 1, e.seed, 3);
        c.globalCompositeOperation = 'lighter';
        soft(c, x, y, 60 * t, rgba('#ffffff', 0.8), rgba(col, 0));
        break;
      case 'dashTrail':
      case 'chargeTrail':
      case 'pounceTrail':
      case 'leapTrail':
      case 'shadowTrail':
      case 'daggerReturn': {
        // Traînée d'une ruée : rémanence effilée.
        c.translate(x, y);
        c.rotate(a);
        c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(0, 0, r, 0);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(1, rgba(col, 0.6 * t));
        c.fillStyle = g;
        const w = (e.w || 16) * t;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(r, -w);
        c.lineTo(r, w);
        c.closePath();
        c.fill();
        break;
      }
      case 'muzzle':
        c.globalCompositeOperation = 'lighter';
        soft(c, x + Math.cos(a) * 22, y + Math.sin(a) * 22, 14 * t, rgba('#ffffff', 0.8), rgba(col, 0));
        break;
      case 'spark': {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = t;
        starShape(((c.fillStyle = rgba(col, 0.9)), c), x, y, (e.r || 18) * (0.4 + age * 0.6), e.a);
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(x, y, 3.5 * t, 0, TAU);
        c.fill();
        break;
      }
      // ------------------------------------------------ Nature
      case 'roots': {
        // Racines géantes qui jaillissent puis se retirent.
        const rand = rng(e.seed);
        for (let k = 0; k < 7; k++) {
          const ang = rand() * TAU,
            d = rand() * r * 0.8,
            h = 30 + rand() * 30;
          rootSpike(
            c,
            x + Math.cos(ang) * d,
            y + Math.sin(ang) * d * 0.5,
            h,
            (rand() - 0.5) * 0.8,
            clamp01(age * 1.2 - k * 0.04),
            '#c8e890'
          );
        }
        if (age < 0.25) {
          c.fillStyle = rgba('#3a2a18', 0.5 * (1 - age * 4));
          c.beginPath();
          c.ellipse(x, y, r, r * 0.45, 0, 0, TAU);
          c.fill();
        }
        break;
      }
      case 'rooted': {
        // Racines enroulées autour des pieds du monstre.
        c.strokeStyle = '#4a3220';
        c.lineWidth = 4;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.ellipse(x, y + 4 - k * 6, 18 - k * 2, 6, 0, Math.PI * 0.1 + k, Math.PI * 1.6 + k);
          c.stroke();
        }
        c.strokeStyle = '#8bd45a';
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(x, y + 4, 18, 6, 0, 0.3, 2.4);
        c.stroke();
        break;
      }
      case 'bloom': {
        const open = ease(Math.min(1, (age * e.max) / 0.8)) * (t < 0.1 ? t / 0.1 : 1);
        // Fleur de lumière douce : en fondu normal (en mode additif, elle éblouissait).
        soft(c, x, y, r, rgba(col, 0.14 * open), rgba(col, 0));
        flower(c, x, y, r * 0.7, open, col, now * 0.3);
        break;
      }
      case 'spores': {
        const fade = Math.min(1, t * 6) * Math.min(1, age * e.max * 3);
        c.globalAlpha = 0.55 * fade;
        const rand = rng(e.seed);
        for (let k = 0; k < 9; k++) {
          const ox = (rand() - 0.5) * r * 1.4 + Math.sin(now + k) * 8,
            oy = (rand() - 0.5) * r * 0.7 + Math.cos(now * 0.8 + k) * 5;
          soft(
            c,
            x + ox,
            y + oy,
            r * (0.35 + rand() * 0.25),
            rgba(k % 2 ? '#8ab83a' : '#b8d860', 0.55),
            rgba('#6a9a2a', 0)
          );
        }
        break;
      }
      case 'petals':
        break;
      // ------------------------------------------------ Sacré
      case 'holyHammer': {
        // Le marteau descend du ciel (35 % de la vie), frappe, puis la lumière éclate.
        const fall = clamp01(age / 0.45);
        runeCircle(c, x, y, r, '#ffe08a', now, 0.8 * t);
        if (fall < 1) {
          c.globalCompositeOperation = 'lighter';
          soft(c, x, y - 240 * (1 - fall), 50, rgba('#fff4c0', 0.6), rgba('#ffd76a', 0));
          c.globalCompositeOperation = 'source-over';
          hammerShape(c, x, y - 240 * (1 - ease(fall)) - 10, 34, -0.6 + fall * 0.6);
        } else {
          const k = clamp01((age - 0.45) / 0.55);
          c.globalCompositeOperation = 'lighter';
          soft(c, x, y, r * (0.5 + k), rgba('#ffffff', 0.9 * (1 - k)), rgba('#ffd76a', 0));
          for (let s = 0; s < 10; s++) {
            const ang = (s / 10) * TAU + e.seed;
            c.strokeStyle = rgba('#fff4c0', 0.8 * (1 - k));
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(x + Math.cos(ang) * r * 0.3, y + Math.sin(ang) * r * 0.2);
            c.lineTo(x + Math.cos(ang) * r * (0.6 + k), y + Math.sin(ang) * r * (0.4 + k * 0.6));
            c.stroke();
          }
          if (k < 0.05) holyBurst(x, y, r, 30);
        }
        break;
      }
      case 'consecrated': {
        const fade = Math.min(1, t * 5) * Math.min(1, age * e.max * 4);
        c.globalCompositeOperation = 'lighter';
        soft(c, x, y, r, rgba('#ffd76a', 0.22 * fade), rgba('#ffd76a', 0));
        runeCircle(c, x, y, r, '#ffe08a', now * 0.5, 0.75 * fade);
        break;
      }
      case 'holyPillar': {
        // Colonne de lumière qui descend du ciel.
        c.globalCompositeOperation = 'lighter';
        const w = 36 * (t < 0.8 ? 1 : (1 - t) * 5 + 0.2),
          g = c.createLinearGradient(x - w, 0, x + w, 0);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(0.5, rgba('#ffffff', 0.85 * t));
        g.addColorStop(1, rgba(col, 0));
        c.fillStyle = g;
        c.fillRect(x - w, y - 420, w * 2, 420);
        runeCircle(c, x, y, Math.min(r, 140), col, now, t);
        break;
      }
      case 'aegisWall': {
        // Égide de lumière : demi-dôme doré aux hexagones.
        c.globalCompositeOperation = 'lighter';
        const fade = Math.min(1, age * e.max * 4) * Math.min(1, t * e.max * 2);
        c.globalAlpha = 0.6 * fade;
        c.strokeStyle = '#ffe8a0';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(x, y - 20, 46, 54, 0, Math.PI, TAU);
        c.stroke();
        soft(c, x, y - 20, 50, rgba('#ffe4a2', 0.25), rgba('#ffe4a2', 0));
        break;
      }
      // ------------------------------------------------ Feu et glace au sol
      case 'meteor': {
        // L'ombre grandit au sol ; le rocher en flammes tombe en diagonale.
        const k = ease(age);
        c.fillStyle = rgba('#000000', 0.35 * k);
        c.beginPath();
        c.ellipse(x, y, r * k, r * 0.5 * k, 0, 0, TAU);
        c.fill();
        c.strokeStyle = rgba('#ff7a2a', 0.8);
        c.lineWidth = 2;
        c.setLineDash([8, 6]);
        c.beginPath();
        c.ellipse(x, y, r, r * 0.5, 0, 0, TAU);
        c.stroke();
        c.setLineDash([]);
        const mx = x - 220 * (1 - age),
          my = y - 380 * (1 - age);
        c.globalCompositeOperation = 'lighter';
        soft(c, mx, my, 46, rgba('#ffe0a0', 0.9), rgba('#ff5a10', 0));
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#4a2a1a';
        rockShape(c, mx, my, 16, now * 3);
        c.fillStyle = rgba('#ff8a2a', 0.8);
        rockShape(c, mx - 3, my - 3, 9, now * 3);
        break;
      }
      case 'crater': {
        const fade = Math.min(1, t * 3);
        c.fillStyle = rgba('#1a1210', 0.45 * fade);
        c.beginPath();
        c.ellipse(x, y, r, r * 0.5, 0, 0, TAU);
        c.fill();
        c.strokeStyle = rgba('#ff7a2a', 0.5 * fade * (0.6 + 0.4 * Math.sin(now * 6)));
        c.lineWidth = 2;
        c.stroke();
        break;
      }
      case 'burnGround':
      case 'fireGround': {
        const fade = Math.min(1, t * 5) * Math.min(1, age * e.max * 4);
        c.globalCompositeOperation = 'lighter';
        soft(c, x, y, r, rgba('#ff6a1a', 0.25 * fade * (0.8 + 0.2 * Math.sin(now * 9))), rgba('#ff6a1a', 0));
        break;
      }
      case 'iceGround': {
        const fade = Math.min(1, t * 5) * Math.min(1, age * e.max * 4);
        c.globalAlpha = fade;
        soft(c, x, y, r, rgba('#dff6ff', 0.35), rgba('#9fdcff', 0));
        const rand = rng(e.seed);
        c.fillStyle = rgba('#e8f8ff', 0.85);
        for (let k = 0; k < 10; k++) {
          const ang = rand() * TAU,
            d = rand() * r * 0.85;
          shardShape(
            c,
            x + Math.cos(ang) * d,
            y + Math.sin(ang) * d * 0.5,
            4 + rand() * 4,
            (rand() - 0.5) * 0.6
          );
        }
        break;
      }
      case 'frozen': {
        // Bloc de glace autour du monstre gelé.
        const fade = Math.min(1, t * e.max * 3) * Math.min(1, age * e.max * 6);
        c.globalAlpha = 0.75 * fade;
        c.fillStyle = 'rgba(200,236,255,0.45)';
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x - r * 0.9, y + 8);
        c.lineTo(x - r, y - r * 1.2);
        c.lineTo(x - r * 0.3, y - r * 1.8);
        c.lineTo(x + r * 0.5, y - r * 1.6);
        c.lineTo(x + r, y - r * 0.8);
        c.lineTo(x + r * 0.9, y + 8);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(x - r * 0.4, y - r * 1.4);
        c.lineTo(x - r * 0.1, y - r * 0.4);
        c.stroke();
        break;
      }
      case 'bloodPool': {
        const fade = Math.min(1, t * 5) * Math.min(1, age * e.max * 4);
        c.globalAlpha = fade;
        c.fillStyle = rgba('#6a0a14', 0.6);
        c.beginPath();
        c.ellipse(x, y, r, r * 0.5, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba('#c02030', 0.4);
        c.beginPath();
        c.ellipse(x - r * 0.2, y - r * 0.05, r * 0.5, r * 0.2, 0, 0, TAU);
        c.fill();
        break;
      }
      case 'poisonPool':
      case 'voidPool': {
        const fade = Math.min(1, t * 5) * Math.min(1, age * e.max * 4),
          base = e.shape === 'voidPool' ? '#2a0a4a' : '#3a6a10',
          hi = e.shape === 'voidPool' ? '#9a5aff' : '#b8f060';
        c.globalAlpha = fade;
        c.fillStyle = rgba(base, 0.65);
        c.beginPath();
        for (let s = 0; s <= 24; s++) {
          const ang = (s / 24) * TAU,
            wob = 1 + 0.08 * Math.sin(ang * 5 + (e.seed % 10) + now * 2);
          c.lineTo(x + Math.cos(ang) * r * wob, y + Math.sin(ang) * r * 0.5 * wob);
        }
        c.fill();
        c.strokeStyle = rgba(hi, 0.6);
        c.lineWidth = 2;
        c.stroke();
        break;
      }
      // ------------------------------------------------ Chasseur
      case 'rainMark':
        c.globalAlpha = Math.min(1, t * 4) * 0.7;
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.setLineDash([10, 8]);
        c.beginPath();
        c.ellipse(x, y, r, r * 0.55, 0, 0, TAU);
        c.stroke();
        c.setLineDash([]);
        break;
      case 'arrowRain': {
        // Des flèches tombent du ciel dans la zone et se fichent au sol.
        const rand = rng(e.seed);
        for (let k = 0; k < 14; k++) {
          const ox = (rand() - 0.5) * r * 1.8,
            oy = (rand() - 0.5) * r * 0.9,
            delay = rand() * 0.4,
            p = clamp01((age - delay) / 0.35),
            tx = x + ox,
            ty = y + oy;
          if (p <= 0) continue;
          const ay = ty - 260 * (1 - p),
            ax = tx - 60 * (1 - p);
          c.strokeStyle = '#5a3a1a';
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(ax, ay);
          c.lineTo(ax - 8, ay - 22);
          c.stroke();
          c.fillStyle = '#e8eef4';
          c.beginPath();
          c.moveTo(ax + 2, ay + 4);
          c.lineTo(ax - 3, ay - 2);
          c.lineTo(ax + 3, ay - 3);
          c.fill();
          if (p >= 1 && age - delay < 0.5) {
            c.fillStyle = rgba('#8a7458', 0.4);
            c.beginPath();
            c.ellipse(tx, ty, 8, 3, 0, 0, TAU);
            c.fill();
          }
        }
        break;
      }
      case 'hawk':
      case 'hawkDive': {
        // Le faucon spectral plonge sur la cible, ses serres frappent, il remonte.
        const k = age,
          dive = e.shape === 'hawkDive',
          sx = dive ? x : x + Math.cos(a) * 140,
          sy = dive ? y : y - 160,
          ex = dive ? x + Math.cos(a) * 60 : x,
          ey = dive ? y - 200 : y,
          px = lerp(sx, ex, ease(k)),
          py = lerp(sy, ey, ease(k)) - Math.sin(k * Math.PI) * 30;
        hawkShape(c, px, py, Math.atan2(ey - sy, ex - sx), 18, now * 30, col);
        if (!dive && k > 0.55 && k < 0.8) clawMarks(c, x, y, a, 30, '#fff3d0', 1 - (k - 0.55) / 0.25);
        break;
      }
      case 'markCast':
        drawMarkAt(c, x, y, 26 * (1 + t), now * 4, t);
        break;
      case 'hawkEye': {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = t;
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(x, y - 60, 26, 12 * (0.3 + 0.7 * ease(age / 0.3)), 0, 0, TAU);
        c.stroke();
        soft(c, x, y - 60, 10, rgba('#ffffff', 0.9), rgba(col, 0));
        break;
      }
      // ------------------------------------------------ Ombre, sang, poison, harmonie
      case 'shadowStep':
        c.globalAlpha = t;
        soft(c, x, y - 10, r * (1 + age), rgba('#1a0a28', 0.7), rgba('#1a0a28', 0));
        break;
      case 'bloodSplash':
      case 'bloodBurst':
        c.globalAlpha = t;
        soft(c, x, y, r * (0.5 + age), rgba('#e0404f', 0.5), rgba('#e0404f', 0));
        break;
      case 'poisonBurst':
        c.globalAlpha = 0.6 * t;
        soft(c, x, y, r * ease(age / 0.5), rgba('#a4e83c', 0.35), rgba('#a4e83c', 0));
        break;
      case 'symphony': {
        const fade = Math.min(1, t * 5);
        c.globalAlpha = 0.7 * fade;
        c.strokeStyle = col;
        c.lineWidth = 1.5;
        for (let k = 0; k < 5; k++) {
          c.beginPath();
          c.ellipse(x, y, r * (0.3 + k * 0.15), r * (0.3 + k * 0.15) * 0.55, 0, now + k, now + k + 4);
          c.stroke();
        }
        break;
      }
      case 'shapeshift':
      case 'elemAvatar':
      case 'ironWill':
      case 'barkSkin':
      case 'frostTrap': {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = t;
        const rr = Math.min(r, 140) * ease(age / 0.5);
        c.strokeStyle = col;
        c.lineWidth = 4 * t;
        c.beginPath();
        c.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU);
        c.stroke();
        soft(c, x, y - 20, 40 * t, rgba('#ffffff', 0.5), rgba(col, 0));
        break;
      }
      case 'bleedDrip':
        break;
      // ------------------------------------------------ Annonces des boss (au sol, avant l'impact)
      case 'tele':
        telegraphGround(c, e);
        break;
      default:
        // Forme inconnue : une lueur discrète plutôt que rien.
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = t;
        soft(c, x, y, Math.min(60, r || 30), rgba(col, 0.5), rgba(col, 0));
    }
    c.restore();
  }
  // Annonce au sol d'un boss sous forme d'effet (forme 'tele', w = sorte).
  function telegraphGround(c, e) {
    const t = e.life / e.max;
    c.globalAlpha = 0.8;
    c.strokeStyle = e.c;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(e.x, e.y, e.r, e.r * 0.6, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(e.c, 0.25);
    c.beginPath();
    c.ellipse(e.x, e.y, e.r * (1 - t), e.r * 0.6 * (1 - t), 0, 0, TAU);
    c.fill();
  }

  // ---------------------------------------------------------------- Marques, boucliers, auras
  function drawMarkAt(c, x, y, s, spin, alpha = 1) {
    c.save();
    c.translate(x, y);
    c.globalAlpha *= alpha;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = '#ffd27a';
    c.lineWidth = 2;
    c.rotate(spin);
    for (let k = 0; k < 4; k++) {
      c.rotate(Math.PI / 2);
      c.beginPath();
      c.arc(0, 0, s, -0.5, 0.5);
      c.stroke();
      c.beginPath();
      c.moveTo(s + 3, 0);
      c.lineTo(s - 6, 0);
      c.stroke();
    }
    c.restore();
  }
  // Marque du chasseur au-dessus d'une proie.
  function drawMark(c, m, frame) {
    drawMarkAt(c, m.x, m.y - (m.boss ? 90 : 60), 14, frame * 0.05, 0.9);
  }
  // Le sceau reste au-dessus de la cible pendant qu'elle se déplace.
  function drawHolySeal(c, m, frame) {
    const y = m.y - (m.boss || m.worldBoss || m.arenaBoss ? 110 : 72);
    c.save();
    c.translate(m.x, y);
    soft(c, 0, 0, 20, rgba('#ffe08a', 0.35 + 0.12 * Math.sin(frame * 0.15)), rgba('#ffe08a', 0));
    c.strokeStyle = '#ffe08a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -12);
    c.lineTo(9, 0);
    c.lineTo(0, 12);
    c.lineTo(-9, 0);
    c.closePath();
    c.stroke();
    c.strokeStyle = '#fff5cc';
    c.beginPath();
    c.moveTo(0, -6);
    c.lineTo(0, 6);
    c.moveTo(-4, -1);
    c.lineTo(4, -1);
    c.stroke();
    c.restore();
  }
  // Bouclier d'un héros : bulle de lumière bleutée qui ondule.
  function drawShield(c, p, frame) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pulse = 0.5 + 0.2 * Math.sin(frame * 0.12);
    soft(c, p.x, p.y - 10, 40, rgba('#bfe4ff', 0.12 * pulse), rgba('#bfe4ff', 0.25 * pulse));
    c.strokeStyle = rgba('#dff2ff', 0.6 * pulse);
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(p.x, p.y - 8, 28, 36, 0, 0, TAU);
    c.stroke();
    c.restore();
  }
  // Aura continue autour d'un héros (particules) : notes, sang, feuilles, plumes, acier, éléments, lumière.
  function aura(p, kind, frame) {
    if (frame % 5 !== 0) return;
    const x = p.x + (R() - 0.5) * 32,
      y = p.y + 8;
    switch (kind) {
      case 'notes':
        emit('note', x, y, { vy: -45, life: 0.9, size: 4, c: '#ff9ad5' });
        break;
      case 'blood':
        emit('drop', x, y - 30, {
          vy: 60,
          vx: (R() - 0.5) * 20,
          ay: 200,
          life: 0.6,
          size: 2.5,
          c: '#c01828'
        });
        emit('wisp', x, y, { vy: -40, life: 0.6, size: 6, c: '#e0404f' });
        break;
      case 'leaves':
        emit('leaf', x, y, {
          vy: -30,
          vx: (R() - 0.5) * 30,
          life: 0.9,
          size: 3.5,
          c: R() < 0.5 ? '#7ee36a' : '#b8f08a'
        });
        break;
      case 'feathers':
        emit('feather', x, y - 40, { vy: 30, vx: (R() - 0.5) * 30, life: 1, size: 3.5, c: '#e8c27a' });
        break;
      case 'steel':
        emit('glint', x, y - 20, { vy: -80, life: 0.35, c: '#e8f0ff' });
        break;
      case 'elements': {
        const k = Math.floor(R() * 3);
        emit(k === 0 ? 'flame' : k === 1 ? 'snow' : 'spark', x, y - 10, {
          vy: -50,
          vx: (R() - 0.5) * 40,
          life: 0.6,
          size: k === 0 ? 8 : 2.5,
          c: ['#ff8a2a', '#dff6ff', '#f4f07a'][k]
        });
        break;
      }
      case 'holy':
        emit('motes', x, y, { vy: -50, life: 0.9, size: 2, c: '#ffe08a' });
        break;
    }
  }

  // ---------------------------------------------------------------- Projectiles
  // Formes des projectiles des classes : boule de feu, flammèche, épine, dague, flèche lourde.
  function projectile(c, p) {
    const a = Number.isFinite(p.a) ? p.a : Math.atan2(p.vy || 0, p.vx || 0),
      ca = Math.cos(a),
      sa = Math.sin(a),
      col = p.c || '#ffffff',
      now = performance.now() / 1000;
    c.save();
    switch (p.kind) {
      case 'fireball': {
        // Boule de feu : cœur blanc, flammes qui lèchent l'arrière, et des braises.
        c.globalCompositeOperation = 'lighter';
        for (let k = 6; k >= 1; k--) {
          const wob = Math.sin(now * 30 + k) * 3;
          soft(
            c,
            p.x - ca * k * 7 - sa * wob,
            p.y - sa * k * 7 + ca * wob,
            16 - k * 1.6,
            rgba(mix('#ffd27a', '#ff3a08', k / 6), 0.6),
            rgba('#ff3a08', 0)
          );
        }
        soft(c, p.x, p.y, 18, rgba('#fff6c0', 1), rgba('#ff8a2a', 0));
        if (R() < 0.6)
          emit('ember', p.x, p.y, {
            vx: -p.vx * 4 + (R() - 0.5) * 60,
            vy: -p.vy * 4 + (R() - 0.5) * 60,
            life: 0.4,
            size: 2.5,
            c: '#ffd27a'
          });
        if (R() < 0.5)
          emit('flame', p.x - ca * 10, p.y - sa * 10, {
            vx: -p.vx * 2,
            vy: -p.vy * 2 - 20,
            life: 0.3,
            size: 9,
            c: '#ff8a2a'
          });
        break;
      }
      case 'ember':
        c.globalCompositeOperation = 'lighter';
        soft(c, p.x, p.y, 10, rgba('#fff0b0', 0.95), rgba('#ff7a2a', 0));
        if (R() < 0.5)
          emit('flame', p.x, p.y, { vx: -p.vx * 2, vy: -p.vy * 2 - 10, life: 0.25, size: 6, c: '#ff8a2a' });
        break;
      case 'thorn':
        // Graine épineuse qui tournoie, avec une traînée de feuilles.
        c.translate(p.x, p.y);
        c.rotate(now * 12);
        c.fillStyle = '#4a7a2a';
        c.beginPath();
        c.arc(0, 0, 6, 0, TAU);
        c.fill();
        c.fillStyle = '#d8f0a0';
        for (let k = 0; k < 6; k++) {
          c.rotate(TAU / 6);
          c.beginPath();
          c.moveTo(4, -2);
          c.lineTo(11, 0);
          c.lineTo(4, 2);
          c.fill();
        }
        if (R() < 0.35)
          emit('leaf', p.x, p.y, {
            vx: (R() - 0.5) * 30,
            vy: (R() - 0.5) * 30,
            life: 0.6,
            size: 3,
            c: '#8bd45a'
          });
        break;
      case 'dagger':
        // Dague lancée qui tourne sur elle-même.
        c.translate(p.x, p.y);
        c.rotate(now * 25);
        c.fillStyle = '#e8eef4';
        c.strokeStyle = '#2a1a30';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(12, 0);
        c.lineTo(0, -3);
        c.lineTo(-4, 0);
        c.lineTo(0, 3);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = col;
        c.fillRect(-9, -2, 6, 4);
        break;
      case 'heavyArrow': {
        // Flèche lourde : sillage de vent doré.
        c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(p.x, p.y, p.x - ca * 90, p.y - sa * 90);
        g.addColorStop(0, rgba(col, 0.7));
        g.addColorStop(1, rgba(col, 0));
        c.strokeStyle = g;
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - ca * 90, p.y - sa * 90);
        c.stroke();
        c.globalCompositeOperation = 'source-over';
        canaanDrawProjectile(c, { ...p, kind: 'arrow' });
        break;
      }
      default:
        c.restore();
        return false;
    }
    c.restore();
    return true;
  }

  // ---------------------------------------------------------------- Boss : matières, annonces, sols, projectiles
  // Matière d'une couleur de boss : feu, glace, foudre, ombre, poison, sacré ou roche (d'après sa teinte).
  function themeOf(col) {
    const el = elementOf(col);
    if (el) return { nature: 'poison', harmony: 'shadow', wild: 'stone', steel: 'stone' }[el] || el;
    const [r, g, b] = rgb(col),
      max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min;
    if (d < 40) return max > 200 ? 'holy' : 'stone';
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    if (h < 25 || h >= 335) return 'fire';
    if (h < 50) return max > 230 && g > 150 ? 'holy' : 'fire';
    if (h < 70) return 'lightning';
    if (h < 160) return 'poison';
    if (h < 200) return 'ice';
    if (h < 250) return 'ice';
    return 'shadow';
  }
  const THEME_COLOR = {
    fire: '#ff7a2a',
    ice: '#bfeaff',
    lightning: '#f4f07a',
    shadow: '#a060ff',
    poison: '#a4e83c',
    holy: '#ffe08a',
    stone: '#b8a888',
    blood: '#e0404f'
  };
  // Impact d'un boss : une vraie explosion de sa matière (envoyée aux invités comme les effets des sorts).
  function bossImpact(x, y, r, col, big = false) {
    const theme = themeOf(col),
      c = THEME_COLOR[theme] || col,
      fx = (shape, rr, d) => CANAAN_SKILLS.fx(shape, x, y, 0, rr, 0, c, d);
    if (theme === 'fire') fx('flames', r, 0.8);
    else if (theme === 'ice') fx('frostNova', r, 0.7);
    else if (theme === 'lightning') {
      fx('skybolt', 40, 0.45);
      fx('elemBurst', r, 0.5);
    } else if (theme === 'holy') fx('holyPillar', r, 0.8);
    else if (theme === 'poison') fx('poisonBurst', r, 0.7);
    else if (theme === 'shadow') {
      fx('shadowStep', Math.min(r, 80), 0.7);
      fx('elemBurst', r, 0.5);
    } else if (theme === 'blood') fx('bloodBurst', r, 0.6);
    if (big || theme === 'stone') fx('groundSmash', r, 0.7);
  }
  // Annonce au sol d'une attaque de boss : le sol se fissure et rougeoit de la matière du boss, l'intérieur se remplit
  // jusqu'à l'impact (k de 0 à 1), le contour devient blanc au dernier moment.
  // shape : circle, cone, line, donut, mark, soak, safe.
  function telegraph(c, shape, z, k, col, frame) {
    const theme = themeOf(col),
      tc = THEME_COLOR[theme] || col,
      danger = k > 0.75,
      edge = danger ? '#ffffff' : tc,
      seed = (Math.round(z.x) * 73856093) ^ (Math.round(z.y) * 19349663);
    c.save();
    const glowFill = r => {
      const g = c.createRadialGradient(z.x, z.y, r * 0.1, z.x, z.y, r);
      g.addColorStop(0, rgba(tc, 0.05));
      g.addColorStop(0.75, rgba(tc, 0.22 + 0.25 * k));
      g.addColorStop(1, rgba(tc, 0.5 + 0.3 * k));
      return g;
    };
    const cracks = (cx, cy, r, a0, a1, n) => {
      const rand = rng(seed);
      c.strokeStyle = rgba(mix(tc, '#ffffff', 0.4), 0.35 + 0.55 * k);
      c.lineWidth = 1.6;
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * rand();
        let px = cx,
          py = cy,
          len = r * (0.35 + 0.6 * rand()) * Math.min(1, k * 1.4 + 0.2);
        c.beginPath();
        c.moveTo(px, py);
        for (let s = 0; s < 4; s++) {
          const j = a + (rand() - 0.5) * 0.6;
          px += Math.cos(j) * (len / 4);
          py += Math.sin(j) * (len / 4) * 0.62;
          c.lineTo(px, py);
        }
        c.stroke();
      }
    };
    if (shape === 'circle' || shape === 'mark' || shape === 'soak') {
      const ry = z.r * 0.62;
      c.fillStyle = rgba('#000000', 0.18);
      c.beginPath();
      c.ellipse(z.x, z.y, z.r, ry, 0, 0, TAU);
      c.fill();
      c.fillStyle = glowFill(z.r);
      c.beginPath();
      c.ellipse(z.x, z.y, z.r * (shape === 'circle' ? k : 1), ry * (shape === 'circle' ? k : 1), 0, 0, TAU);
      c.fill();
      cracks(z.x, z.y, z.r, 0, TAU, 9);
      runeCircle(c, z.x, z.y, z.r, edge, frame * 0.02, 0.85);
      if (shape === 'soak') {
        // Impact partagé : un anneau doré qui se resserre.
        c.strokeStyle = '#ffd34a';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(z.x, z.y, z.r * (1 - k * 0.8), ry * (1 - k * 0.8), 0, 0, TAU);
        c.stroke();
      }
      if (shape === 'mark') {
        // Sigille au-dessus du héros visé.
        c.globalCompositeOperation = 'lighter';
        starShape(
          ((c.fillStyle = rgba(edge, 0.7)), c),
          z.x,
          z.y - 70,
          12 + 4 * Math.sin(frame * 0.2),
          frame * 0.05
        );
      }
    } else if (shape === 'cone') {
      const wedge = r => {
        c.beginPath();
        c.moveTo(z.x, z.y);
        c.arc(z.x, z.y, r, z.a - z.w / 2, z.a + z.w / 2);
        c.closePath();
      };
      c.fillStyle = rgba('#000000', 0.16);
      wedge(z.r);
      c.fill();
      c.fillStyle = glowFill(z.r);
      wedge(z.r * k);
      c.fill();
      cracks(z.x, z.y, z.r, z.a - z.w / 2, z.a + z.w / 2, 8);
      c.strokeStyle = edge;
      c.lineWidth = 2.5;
      wedge(z.r);
      c.stroke();
    } else if (shape === 'line') {
      // Faille au sol le long de la ligne.
      c.translate(z.x, z.y);
      c.rotate(z.a);
      const w = z.w;
      c.fillStyle = rgba('#000000', 0.16);
      c.fillRect(0, -w / 2, z.len, w);
      const g = c.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, rgba(tc, 0.5));
      g.addColorStop(0.5, rgba(tc, 0.15 + 0.3 * k));
      g.addColorStop(1, rgba(tc, 0.5));
      c.fillStyle = g;
      c.fillRect(0, -w / 2, z.len * k, w);
      const rand = rng(seed);
      c.strokeStyle = rgba(mix(tc, '#ffffff', 0.5), 0.5 + 0.5 * k);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, 0);
      for (let s = 1; s <= 14; s++) c.lineTo((z.len * k * s) / 14, (rand() - 0.5) * w * 0.5);
      c.stroke();
      c.strokeStyle = edge;
      c.lineWidth = 2.5;
      c.strokeRect(0, -w / 2, z.len, w);
    } else if (shape === 'donut') {
      c.fillStyle = glowFill(z.r);
      c.beginPath();
      c.ellipse(z.x, z.y, z.r, z.r * 0.62, 0, 0, TAU);
      c.ellipse(z.x, z.y, z.r0, z.r0 * 0.62, 0, 0, TAU, true);
      c.fill();
      cracks(z.x, z.y, z.r, 0, TAU, 12);
      runeCircle(c, z.x, z.y, z.r0, '#5aff8a', -frame * 0.03, 0.95);
    } else if (shape === 'safe') {
      runeCircle(c, z.x, z.y, z.r, '#5aff8a', frame * 0.03, 0.95);
      c.globalCompositeOperation = 'lighter';
      soft(c, z.x, z.y, z.r, rgba('#5aff8a', 0.25 + 0.1 * Math.sin(frame * 0.2)), rgba('#5aff8a', 0));
    }
    c.restore();
    // Particules de la matière qui s'élèvent de la zone annoncée.
    if (frame % 4 === 0 && (shape === 'circle' || shape === 'cone' || shape === 'line')) {
      const rr = (z.r || z.len || 60) * 0.7,
        px = shape === 'line' ? z.x + Math.cos(z.a) * z.len * R() : z.x + (R() - 0.5) * rr * 1.4,
        py = shape === 'line' ? z.y + Math.sin(z.a) * z.len * R() : z.y + (R() - 0.5) * rr * 0.8;
      if (theme === 'fire')
        emit('ember', px, py, { vy: -80, vx: (R() - 0.5) * 30, life: 0.7, size: 2.5, c: '#ffd27a' });
      else if (theme === 'ice') emit('snow', px, py - 20, { vy: 20, life: 0.8, size: 2, c: '#ffffff' });
      else if (theme === 'poison') emit('bubble', px, py, { vy: -20, life: 0.8, size: 2.5, c: '#b8f060' });
      else if (theme === 'shadow') emit('wisp', px, py, { vy: -30, life: 0.8, size: 5, c: '#9a5aff' });
      else if (theme === 'lightning')
        emit('spark', px, py, { vx: (R() - 0.5) * 200, vy: (R() - 0.5) * 200, life: 0.2, c: '#fffbb0' });
      else if (theme === 'holy') emit('motes', px, py, { vy: -40, life: 0.8, size: 2, c: '#ffe08a' });
      else emit('dust', px, py, { vy: -10, life: 0.8, size: 8, grow: 8, c: '#8a7458' });
    }
  }
  // Sol dangereux d'un boss (flaque, braises, tempête, néant) : une matière vivante plutôt qu'un disque plat.
  function hazard(c, hz, frame, fade = 1) {
    const theme = hz.kind === 'storm' ? 'lightning' : themeOf(hz.color),
      tc = THEME_COLOR[theme] || hz.color;
    c.save();
    c.globalAlpha = fade;
    if (theme === 'poison' || theme === 'shadow') {
      const base = theme === 'shadow' ? '#2a0a4a' : '#3a6a10';
      c.fillStyle = rgba(base, 0.6);
      c.beginPath();
      for (let s = 0; s <= 24; s++) {
        const ang = (s / 24) * TAU,
          wob = 1 + 0.08 * Math.sin(ang * 5 + hz.x * 0.1 + frame * 0.04);
        c.lineTo(hz.x + Math.cos(ang) * hz.r * wob, hz.y + Math.sin(ang) * hz.r * 0.62 * wob);
      }
      c.fill();
      c.strokeStyle = rgba(tc, 0.7);
      c.lineWidth = 2;
      c.stroke();
    } else {
      c.globalCompositeOperation = 'lighter';
      soft(c, hz.x, hz.y, hz.r, rgba(tc, 0.35 + 0.1 * Math.sin(frame * 0.15 + hz.x)), rgba(tc, 0.05));
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = rgba(tc, 0.6);
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(hz.x, hz.y, hz.r, hz.r * 0.62, 0, 0, TAU);
      c.stroke();
    }
    if (theme === 'lightning' && frame % 9 === 0) {
      const a = R() * TAU,
        d = R() * hz.r;
      bolt(c, hz.x, hz.y, hz.x + Math.cos(a) * d, hz.y + Math.sin(a) * d * 0.6, '#fffbb0', 1.5, frame, 0);
    }
    c.restore();
    if (frame % 3 === 0) {
      const px = hz.x + (R() - 0.5) * hz.r * 1.6,
        py = hz.y + (R() - 0.5) * hz.r;
      if (theme === 'fire')
        emit('flame', px, py, {
          vy: -60,
          life: 0.5,
          size: 8 + R() * 6,
          grow: 6,
          c: '#ff8a2a',
          c2: '#801808'
        });
      else if (theme === 'poison')
        emit('bubble', px, py, { vy: -14, life: 0.8, size: 2 + R() * 2, c: '#b8f060' });
      else if (theme === 'shadow') emit('wisp', px, py, { vy: -30, life: 0.9, size: 5, c: '#9a5aff' });
      else if (theme === 'ice') emit('mist', px, py, { vy: -6, life: 1.2, size: 16, grow: 8, c: '#cfeeff' });
      else if (theme === 'lightning')
        emit('spark', px, py, { vx: (R() - 0.5) * 240, vy: (R() - 0.5) * 240, life: 0.2, c: '#fffbb0' });
      else if (theme === 'holy') emit('motes', px, py, { vy: -40, life: 0.8, size: 2, c: '#ffe08a' });
      else emit('dust', px, py, { vy: -10, life: 0.8, size: 10, grow: 10, c: '#8a7458' });
    }
  }
  // Projectile d'un boss : orbe de sa matière avec son sillage (flammes, givre, néant…).
  function orb(c, s, frame) {
    const theme = themeOf(s.color),
      tc = THEME_COLOR[theme] || s.color;
    c.save();
    c.globalCompositeOperation = 'lighter';
    soft(c, s.x, s.y, s.r * 2.2, rgba(tc, 0.5), rgba(tc, 0));
    soft(c, s.x, s.y, s.r, rgba('#ffffff', 0.95), rgba(tc, 0.2));
    c.restore();
    if (frame % 2 === 0) {
      const back = { vx: -(s.vx || 0) * 20, vy: -(s.vy || 0) * 20 };
      if (theme === 'fire') emit('flame', s.x, s.y, { ...back, life: 0.35, size: s.r, c: '#ff8a2a' });
      else if (theme === 'ice') emit('shard', s.x, s.y, { ...back, life: 0.4, size: 3, c: '#dff6ff' });
      else if (theme === 'shadow')
        emit('wisp', s.x, s.y, { ...back, life: 0.5, size: s.r * 0.6, c: '#9a5aff' });
      else if (theme === 'poison') emit('bubble', s.x, s.y, { ...back, life: 0.5, size: 2.5, c: '#b8f060' });
      else if (theme === 'lightning')
        emit('spark', s.x, s.y, { vx: (R() - 0.5) * 200, vy: (R() - 0.5) * 200, life: 0.15, c: '#fffbb0' });
      else emit('motes', s.x, s.y, { ...back, life: 0.4, size: 2, c: tc });
    }
  }
  // Rayon d'énergie d'un boss (rayons tournants) : gaine colorée, cœur blanc, éclairs le long du rayon.
  function energyBeam(c, x, y, a, len, w, col, frame) {
    const tc = THEME_COLOR[themeOf(col)] || col;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, -w, 0, w);
    g.addColorStop(0, rgba(tc, 0));
    g.addColorStop(0.3, rgba(tc, 0.55));
    g.addColorStop(0.5, rgba('#ffffff', 0.95));
    g.addColorStop(0.7, rgba(tc, 0.55));
    g.addColorStop(1, rgba(tc, 0));
    c.fillStyle = g;
    c.fillRect(0, -w * (0.9 + 0.1 * Math.sin(frame * 0.5)), len, w * 2 * (0.9 + 0.1 * Math.sin(frame * 0.5)));
    c.restore();
    if (frame % 2 === 0) {
      const d = R() * len;
      emit('spark', x + Math.cos(a) * d, y + Math.sin(a) * d, {
        vx: (R() - 0.5) * 160,
        vy: (R() - 0.5) * 160,
        life: 0.25,
        c: tc
      });
    }
  }
  // Objet qui tombe du ciel sur sa zone (météore, cristal) ; k de 0 à 1 jusqu'à l'impact.
  function falling(c, x, y, k, crystal) {
    const fall = (1 - k) * 420,
      mx = x - fall * 0.4,
      my = y - 30 - fall;
    c.save();
    if (crystal) {
      c.fillStyle = '#e0c0ff';
      shardShape(c, mx, my, 12, 0.3);
      c.globalCompositeOperation = 'lighter';
      soft(c, mx, my, 24, rgba('#f0e0ff', 0.6), rgba('#b070e0', 0));
    } else {
      c.globalCompositeOperation = 'lighter';
      soft(c, mx, my, 34, rgba('#ffe0a0', 0.85), rgba('#ff5a10', 0));
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#4a2a1a';
      rockShape(c, mx, my, 13, k * 8);
      c.fillStyle = rgba('#ff8a2a', 0.8);
      rockShape(c, mx - 2, my - 2, 7, k * 8);
      if (R() < 0.7) emit('flame', mx, my, { vx: 40, vy: -60, life: 0.35, size: 12, c: '#ff8a2a' });
    }
    c.restore();
  }

  window.CANAAN_VFX = Object.freeze({
    start,
    tick,
    step,
    draw,
    drawParticles,
    isGround: shape => GROUND.has(shape),
    drawMark,
    drawHolySeal,
    drawShield,
    aura,
    projectile,
    emit,
    spray,
    burst: elemBurst,
    bolt,
    soft,
    rgba,
    runeCircle,
    rockShape,
    themeOf,
    bossImpact,
    telegraph,
    hazard,
    orb,
    energyBeam,
    falling,
    particles: () => parts.length,
    clear: () => (parts.length = 0)
  });
})();
