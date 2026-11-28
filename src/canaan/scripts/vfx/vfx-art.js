// Effets visuels des sorts et des mécaniques de boss : de vraies matières plutôt que des formes géométriques.
// Le feu est fait de flammes, de braises et de fumée, la glace d'éclats et de brume, la foudre d'éclairs ramifiés, la
// nature de lianes, de racines, de feuilles et de pétales, le sacré de piliers et de runes, le sang de gouttes.
// Chaque effet ({ shape, x, y, a, r, w, c, life, max } : weapon-actions.js, boss-mechanics.js, arena.js) est dessiné
// par sa forme ; start() et tick() émettent ses particules. Les particules ne sont que de l'affichage (rien n'est
// simulé, rien n'est envoyé) : un invité qui reçoit l'effet en fait naître les siennes.
// CANAAN_VFX.draw(ctx, e), start(e), tick(e, dt), step(dt), drawParticles(ctx, ground), isGround(shape), drawMark, drawShield,
// aura, telegraph (annonces des boss), projectile (formes des projectiles).
// Le dessin de chaque forme est dans client/art/vfx-effects.js, les effets des boss (annonces, sols, orbes) dans boss.js.
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
  // Particules d'un sol (flaque, brasier, givre…) : dessinées avec lui, sous les personnages.
  let emitGround = false;
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
      z: o.z ?? 0,
      ground: emitGround
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
  // ground : seulement les particules des sols (couche du sol) ; sinon, toutes les autres.
  function drawParticles(c, ground = false) {
    if (!parts.length) return;
    c.save();
    for (const p of parts) {
      if (p.ground !== ground) continue;
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
    emitGround = GROUND.has(e.shape);
    try {
      startBody(e);
    } finally {
      emitGround = false;
    }
  }
  function startBody(e) {
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
    emitGround = GROUND.has(e.shape);
    try {
      tickBody(e, dt);
    } finally {
      emitGround = false;
    }
  }
  function tickBody(e, dt) {
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

  // ---------------------------------------------------------------- Effets : dessin (client/art/vfx-effects.js)
  const { draw } = CANAAN_VFX_EFFECTS.create({
    TAU,
    rgba,
    elementOf,
    rng,
    lerp,
    clamp01,
    ease,
    shardShape,
    starShape,
    rockShape,
    soft,
    holyBurst,
    bolt,
    bladeArc,
    clawMarks,
    flower,
    rootSpike,
    hawkShape,
    hammerShape,
    runeCircle,
    drawMarkAt
  });
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
  // Les trois écus suivent le porteur. L'ellipse au sol et les traînées donnent de la profondeur à l'orbite.
  function drawShieldOrbit(c, p, frame, left) {
    const angle = frame * 0.1,
      fade = Math.min(1, left * 4),
      radius = 70;
    c.save();
    runeCircle(c, p.x, p.y, radius, '#ffe08a', angle * 0.6, 0.65 * fade);
    const shields = [0, 1, 2].map(i => {
      const a = angle + (i * TAU) / 3;
      return { a, depth: Math.sin(a) };
    });
    shields.sort((a, b) => a.depth - b.depth);
    for (const { a, depth } of shields) {
      const x = p.x + Math.cos(a) * radius,
        y = p.y - 22 + depth * 37;
      c.save();
      c.globalAlpha = fade;
      c.globalCompositeOperation = 'lighter';
      for (let i = 1; i <= 7; i++) {
        const trail = a - i * 0.085;
        soft(
          c,
          p.x + Math.cos(trail) * radius,
          p.y - 22 + Math.sin(trail) * 37,
          10 + i,
          rgba('#f6c45d', 0.22 * (1 - i / 8)),
          rgba('#f6c45d', 0)
        );
      }
      soft(c, x, y, 30, rgba('#ffe08a', 0.42), rgba('#ffe08a', 0));
      c.globalCompositeOperation = 'source-over';
      c.translate(x, y);
      const scale = 0.92 + depth * 0.17;
      c.scale(scale, scale);
      c.rotate(Math.cos(a) * 0.27);
      const enamel = c.createLinearGradient(-12, -9, 10, 12);
      enamel.addColorStop(0, '#76b7ed');
      enamel.addColorStop(0.45, '#406cb2');
      enamel.addColorStop(1, '#253a72');
      c.fillStyle = enamel;
      c.strokeStyle = '#ffdf86';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, -15);
      c.quadraticCurveTo(7, -11, 13, -12);
      c.quadraticCurveTo(12, 9, 0, 16);
      c.quadraticCurveTo(-12, 9, -13, -12);
      c.quadraticCurveTo(-7, -11, 0, -15);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = '#fff4c7';
      c.lineWidth = 1.7;
      c.beginPath();
      c.moveTo(0, -9);
      c.lineTo(0, 9);
      c.moveTo(-7, -3);
      c.lineTo(7, -3);
      c.stroke();
      c.restore();
    }
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

  // ---------------------------------------------------------------- Boss (scripts/vfx/boss.js)
  const { themeOf, bossImpact, telegraph, hazard, orb, energyBeam, falling } = CANAAN_VFX_BOSS.create({
    TAU,
    rgb,
    rgba,
    mix,
    elementOf,
    rng,
    R,
    emit,
    shardShape,
    starShape,
    rockShape,
    soft,
    bolt,
    runeCircle
  });
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
    drawShieldOrbit,
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
