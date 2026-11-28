// @ts-check
// Dessin de chaque effet visuel d'après sa forme (shape) : entailles, éclairs, piliers sacrés, météores, lianes, sols
// brûlants ou gelés, flaques, annonces au sol… Les particules (naissance et vie des effets), les marques, boucliers,
// auras, projectiles et matières des boss sont dans scripts/vfx/vfx-art.js et boss.js.
// vfx-art.js appelle CANAAN_VFX_EFFECTS.create(outils) une fois.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).

function create(scene) {
  const {
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
  } = scene;

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
        draw(c, {
          ...e,
          shape: 'crossSlash',
          x: x - Math.cos(a) * r * 0.55,
          y: y - Math.sin(a) * r * 0.55
        });
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
      case 'shieldPulse': {
        const wave = r * (0.3 + 0.7 * ease(age));
        c.globalCompositeOperation = 'lighter';
        runeCircle(c, x, y, wave, '#ffe08a', now * 0.8, 0.8 * t);
        c.strokeStyle = rgba('#fff5d3', 0.7 * t);
        c.lineWidth = 3 * t + 1;
        c.beginPath();
        c.ellipse(x, y, wave, wave * 0.58, 0, 0, TAU);
        c.stroke();
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

  return Object.freeze({
    draw
  });
}
export const CANAAN_VFX_EFFECTS = Object.freeze({ create });
