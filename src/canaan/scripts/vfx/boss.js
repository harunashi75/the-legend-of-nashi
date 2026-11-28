// Effets visuels des boss : matière d'après la couleur du boss (feu, glace, foudre, ombre, poison, sacré, roche),
// impacts, annonces au sol (cercle, cône, anneau, ligne, marque, zone sûre, partage), sols dangereux, orbes, rayons
// et chutes de pierres ou de cristaux. scripts/vfx/vfx-art.js appelle CANAAN_VFX_BOSS.create(outils) une fois.
(() => {
  'use strict';
  function create(scene) {
    const {
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
    } = scene;

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
        else if (theme === 'ice')
          emit('mist', px, py, { vy: -6, life: 1.2, size: 16, grow: 8, c: '#cfeeff' });
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
        else if (theme === 'poison')
          emit('bubble', s.x, s.y, { ...back, life: 0.5, size: 2.5, c: '#b8f060' });
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
      c.fillRect(
        0,
        -w * (0.9 + 0.1 * Math.sin(frame * 0.5)),
        len,
        w * 2 * (0.9 + 0.1 * Math.sin(frame * 0.5))
      );
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

    return Object.freeze({
      themeOf,
      bossImpact,
      telegraph,
      hazard,
      orb,
      energyBeam,
      falling
    });
  }
  window.CANAAN_VFX_BOSS = Object.freeze({ create });
})();
