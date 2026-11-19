// Affichage des créatures et des boss (aura, anneau d'élite, gros format, animations), lumières dynamiques, particules
// d'ambiance, coffres et barre de boss, pour le monde comme pour les instances. La silhouette de chaque espèce vient de
// client/art/creature-art.js ; les outils de dessin (toile, contour, modelé, couleurs, bruit) du kit de pixel art
// commun (client/art/pixel-kit.js).
(() => {
  'use strict';
  // Outils de dessin communs (client/art/pixel-kit.js) ; contour et modelé restent publics sous leurs anciens noms.
  const {
    makeCanvas,
    rect,
    outlineSprite: canaanOutline,
    polish: canaanPolish,
    shade,
    rgba,
    noise
  } = CANAAN_PIXEL_KIT;

  // ---------------------------------------------------------------- Apparence des créatures
  // Chaque espèce a sa propre silhouette (client/art/creature-art.js). Les monstres du monde et les boss mondiaux
  // prennent la leur dans leurs données (MOB_TYPES, WORLD_BOSS_DEFS) ; ceux des instances, de l'Arène et des quêtes
  // arrivent déjà avec `look`, `pal` et `lookOpts`.
  const { creatureSprite, creatureFloats, creatureLegs } = CANAAN_CREATURE_ART;
  // Fixe une seule fois l'apparence d'une créature.
  function resolveLook(m) {
    if (m.look) return;
    const def = m.worldBoss
      ? WORLD_BOSSES.find(b => b.id === m.worldBossId)
      : canaanMobTypes().find(t => t.name === m.t && t.look);
    if (def?.look) {
      Object.assign(m, { look: def.look, pal: def.pal, lookOpts: def.opts || {} });
      return;
    }
    const col = m.mobColor || m.bossColor || '#8b9a86';
    Object.assign(m, {
      look: 'bandit',
      pal: [col, shade(col, 0.6), shade(col, 1.3), '#e0c060', '#ffffff'],
      lookOpts: {}
    });
  }
  // Options de dessin : celles de l'espèce, et la variante d'élite pour une élite (pas pour un boss, déjà marqué).
  function lookOf(m) {
    const opts = m.lookOpts || {};
    return m.elite && !opts.elite && !m.boss && !m.worldBoss ? { ...opts, elite: true } : opts;
  }
  function actor(m) {
    return creatureSprite(m.look, m.pal, lookOf(m));
  }
  // Image d'une créature au repos (bestiaire du panneau des succès) : même apparence qu'en jeu.
  function actorPortrait(m) {
    resolveLook(m);
    return actor(m);
  }
  // Dessine n'importe quel monstre : normal, élite, boss mondial ou boss d'instance.
  function drawCanaanActor(c, m) {
    resolveLook(m);
    const opts = m.lookOpts || {},
      spr = actor(m),
      big = m.boss || m.worldBoss,
      scale = canaanMobScale(m),
      floats = creatureFloats(m.look),
      bob = floats ? Math.sin(time * 0.08 + m.x) * (big ? 6 : 3) : 0,
      w = 34 * scale,
      h = 42 * scale;
    c.save();
    if (big) {
      const aura = m.bossColor || m.mobColor || m.pal[3];
      c.globalAlpha = 0.25 + Math.sin(time * 0.08) * 0.1;
      c.fillStyle = aura;
      c.beginPath();
      c.ellipse(m.x, m.y + 8, w * 0.48, w * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      canaanLight(m.x, m.y - h * 0.4, 210, m.pal[4]);
    } else if (m.elite) {
      // Élite : anneau doré et étincelles en orbite.
      c.strokeStyle = '#ffd36d';
      c.lineWidth = 3;
      c.globalAlpha = 0.55 + Math.sin(time * 0.1 + m.x) * 0.2;
      c.beginPath();
      c.ellipse(m.x, m.y + 6, w * 0.42, w * 0.16, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#fff2a8';
      for (let k = 0; k < 3; k++) {
        const a = time * 0.05 + (k * Math.PI * 2) / 3;
        c.fillRect(m.x + Math.cos(a) * w * 0.42 - 2, m.y + 6 + Math.sin(a) * w * 0.16 - 2, 4, 4);
      }
      c.globalAlpha = 1;
      canaanLight(m.x, m.y - h * 0.4, 90, '#ffd36d');
    }
    if (opts.halo) {
      c.strokeStyle = m.pal[3];
      c.lineWidth = big ? 5 : 2;
      c.globalAlpha = 0.8;
      c.beginPath();
      c.ellipse(m.x, m.y - h * 0.88 + bob, w * 0.26, w * 0.08, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    drawAnimated(c, m, spr, scale, w, h, bob, floats);
    c.restore();
    drawWade(c, m, m.x, m.y + h * 0.08, w, m._walking, scale / 1.5);
  }
  // Silhouette blanche d'un sprite, pour le clignotement quand le monstre est touché.
  const WHITE = new WeakMap();
  function whiteOf(spr) {
    let wcv = WHITE.get(spr);
    if (wcv) return wcv;
    wcv = makeCanvas(spr.width, spr.height);
    const g = wcv.getContext('2d');
    g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-in';
    rect(g, 0, 0, spr.width, spr.height, '#ffffff');
    WHITE.set(spr, wcv);
    return wcv;
  }
  // Animations : orientation, pas alternés et rebond en marche, élan et trace de coup à l'attaque,
  // clignotement blanc sous les coups. Tout est déduit de l'état du monstre, sans changer la simulation.
  const SQUASHY = new Set(['slime', 'slug', 'grub']),
    FLAPPING = new Set(['bat', 'mosquito', 'owl', 'fairy', 'flyer']);
  function drawAnimated(c, m, spr, scale, w, h, bob, floats) {
    const lx = m._lastX ?? m.x,
      ly = m._lastY ?? m.y,
      dx = m.x - lx,
      dy = m.y - ly,
      moved = Math.hypot(dx, dy);
    m._lastX = m.x;
    m._lastY = m.y;
    if (moved > 0.01 && moved < 40) {
      m._moveT = time;
      m._phase = (m._phase || 0) + moved;
    }
    if (Math.abs(dx) > 0.02 && moved < 40) m._face = dx > 0 ? 1 : -1;
    m._walking = time - (m._moveT ?? -99) < 6;
    if (m.cd > (m._cdSeen ?? m.cd) + 0.3) m._atk = time;
    m._cdSeen = m.cd;
    if (m.hp < (m._hpSeen ?? m.hp)) m._hit = time;
    m._hpSeen = m.hp;
    const phase = (m._phase || 0) * (0.22 / (scale / 1.5)),
      walk = m._walking,
      atk = Math.min(1, (time - (m._atk ?? -99)) / 16),
      lunge = atk < 1 ? Math.sin(atk * Math.PI) : 0,
      // Élan de l'attaque vers le héros visé (pas vers un héros caché par le Voile d'ombre).
      toward = m.targetHero
        ? Math.atan2(m.targetHero.player.y - m.y, m.targetHero.player.x - m.x)
        : m.facingAngle || 0,
      reach = lunge * 9 * (scale / 1.5),
      ox = Math.cos(toward) * reach,
      oy = Math.sin(toward) * reach * 0.6,
      hop = walk && !floats ? Math.abs(Math.sin(phase)) * 2 * (scale / 1.5) : 0,
      x0 = Math.round(m.x - w / 2 + ox),
      y0 = Math.round(m.y - h * 0.9 + bob + oy - hop),
      footX = m.x + ox,
      footY = m.y + h * 0.1 + oy;
    c.imageSmoothingEnabled = false;
    c.save();
    // Retournement horizontal selon la direction (les profils regardent à droite par défaut).
    if ((m._face || 1) < 0) {
      c.translate(footX, 0);
      c.scale(-1, 1);
      c.translate(-footX, 0);
    }
    // Slime : écrasement et étirement ; volants : battement rapide ; attaque : léger gonflement.
    let sx = 1,
      sy = 1;
    if (SQUASHY.has(m.look)) {
      const k = Math.sin(phase * 1.4 + time * (walk ? 0 : 0.05));
      sx = 1 + k * 0.08;
      sy = 1 - k * 0.1;
    } else if (FLAPPING.has(m.look)) sy = 1 + Math.sin(time * 0.5 + m.x) * 0.08;
    if (lunge) {
      sx *= 1 + lunge * 0.08;
      sy *= 1 + lunge * 0.05;
    }
    if (sx !== 1 || sy !== 1) {
      c.translate(footX, footY);
      c.scale(sx, sy);
      c.translate(-footX, -footY);
    }
    const legged = walk && creatureLegs(m.look),
      split = 29,
      dh = h * (split / 42);
    if (legged) {
      // Jambes en deux moitiés levées tour à tour, puis le torse par-dessus.
      const step = Math.sin(phase) * 1.4 * (scale / 1.5),
        legH = h - dh;
      c.drawImage(spr, 0, split, 17, 42 - split, x0, Math.round(y0 + dh - Math.max(0, step)), w / 2, legH);
      c.drawImage(
        spr,
        17,
        split,
        17,
        42 - split,
        x0 + w / 2,
        Math.round(y0 + dh - Math.max(0, -step)),
        w / 2,
        legH
      );
      c.drawImage(spr, 0, 0, 34, split, x0, y0, w, dh);
    } else c.drawImage(spr, x0, y0, Math.round(w), Math.round(h));
    const flash = time - (m._hit ?? -99);
    if (flash < 7) {
      c.globalAlpha = 0.75 * (1 - flash / 7);
      c.drawImage(whiteOf(spr), x0, y0, Math.round(w), Math.round(h));
      c.globalAlpha = 1;
    }
    c.restore();
    // Trace du coup, devant le monstre et vers le héros.
    if (atk < 0.7) {
      const r = 20 * (scale / 1.5),
        cx = m.x + Math.cos(toward) * r * 0.6,
        cy = m.y - h * 0.4 + Math.sin(toward) * r * 0.4,
        sweep = -0.9 + atk * 2.6;
      c.save();
      c.globalAlpha = 0.85 * (1 - atk / 0.7);
      c.strokeStyle = m.boss || m.worldBoss ? m.pal[4] : '#fff4dc';
      c.lineWidth = Math.max(2, 3 * (scale / 1.5));
      c.lineCap = 'round';
      c.beginPath();
      c.arc(cx, cy, r, toward + sweep - 0.7, toward + sweep);
      c.stroke();
      c.restore();
    }
  }

  // ---------------------------------------------------------------- Lumière et particules
  let lights = [],
    lightCanvas = null;
  function canaanLight(x, y, r, col) {
    lights.push({ x, y, r, col });
  }
  function resetCanaanLights() {
    lights = [];
  }
  // Halos précalculés : un disque dégradé blanc (pour percer l'obscurité) et un par couleur (lueurs).
  const PUFFS = {};
  function puff(col) {
    const key = col || 'hole';
    if (PUFFS[key]) return PUFFS[key];
    const c = makeCanvas(128, 128),
      g = c.getContext('2d'),
      grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    grad.addColorStop(0, col ? rgba(col, 1) : 'rgba(0,0,0,1)');
    grad.addColorStop(col ? 1 : 1, col ? rgba(col, 0) : 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    PUFFS[key] = c;
    return c;
  }
  const MAX_LIGHTS = 32;
  // Ambiance : { dark (0–1), tint 'r,g,b', particles, color }. Obscurité percée par le héros et les lumières.
  function drawCanaanLighting(c, amb) {
    // Seules les lumières visibles les plus proches du héros comptent.
    const visible = lights
      .filter(l => Math.abs(l.x - camX - W / 2) < W / 2 + l.r && Math.abs(l.y - camY - H / 2) < H / 2 + l.r)
      .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))
      .slice(0, MAX_LIGHTS);
    if (amb.dark > 0.02) {
      if (!lightCanvas) lightCanvas = makeCanvas(W, H);
      if (lightCanvas.width !== W || lightCanvas.height !== H) {
        lightCanvas.width = W;
        lightCanvas.height = H;
      }
      const g = lightCanvas.getContext('2d'),
        hole = puff(null);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(' + amb.tint + ',' + amb.dark + ')';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-out';
      const hero = amb.heroLight || 330;
      g.drawImage(hole, P.x - camX - hero, P.y - 20 - camY - hero, hero * 2, hero * 2);
      for (const l of visible) g.drawImage(hole, l.x - camX - l.r, l.y - camY - l.r, l.r * 2, l.r * 2);
      g.globalCompositeOperation = 'source-over';
      c.drawImage(lightCanvas, camX, camY);
    }
    // Halo coloré des flammes, cristaux et boss, plus visible dans l'obscurité (lueurs désactivables).
    if (canaanDisplay.glow) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.08 + amb.dark * 0.14;
      for (const l of visible) {
        if (!l.col) continue;
        const r = l.r * 0.6;
        c.drawImage(puff(l.col), l.x - r, l.y - r, r * 2, r * 2);
      }
      c.restore();
    }
    if (amb.particles && canaanDisplay.particles) drawParticles(c, amb.particles, amb.color);
  }
  function drawParticles(c, kind, col) {
    c.save();
    c.fillStyle = col;
    const n = kind === 'mist' ? 14 : 36;
    for (let k = 0; k < n; k++) {
      const sx = noise(k, 1, 7),
        sy = noise(k, 2, 7),
        sp = 0.2 + noise(k, 3, 7) * 0.5;
      let x = sx * W,
        y = sy * H;
      if (kind === 'embers') y = H - ((sy * H + time * sp * 2) % H);
      else if (kind === 'feathers' || kind === 'leaves') {
        y = (sy * H + time * sp) % H;
        x += Math.sin(time * 0.02 + k) * 20;
      } else if (kind === 'mist') x = ((sx * W + time * sp * 0.6) % (W + 300)) - 150;
      else {
        x += Math.sin(time * 0.01 + k) * 30;
        y += Math.cos(time * 0.013 + k) * 20;
      }
      if (kind === 'mist') {
        // Nappe de brume : ovale aux bords fondus (dégradé), qui dérive lentement.
        const mw = 160 + sx * 140,
          mh = 26 + sy * 20,
          puff = mistPuff(col);
        c.globalAlpha = 0.1 + 0.07 * Math.sin(time * 0.01 + k);
        if (puff) c.drawImage(puff, camX + x - mw * 0.2, camY + y - mh * 0.5, mw * 1.4, mh * 2);
        else c.fillRect(camX + x, camY + y, mw, mh);
        continue;
      }
      c.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(time * 0.03 + k));
      if (kind === 'leaves') c.fillStyle = ['#d9542f', '#e98a2c', '#efc145'][k % 3];
      const s = kind === 'feathers' || kind === 'leaves' ? 4 : kind === 'embers' ? 3 : 2;
      c.fillRect(camX + x, camY + y, s, kind === 'feathers' || kind === 'leaves' ? 3 : s);
    }
    c.restore();
  }
  // Nappe de brume floue (dégradé radial dans une petite toile), une par couleur.
  const MIST = new Map();
  function mistPuff(col) {
    if (MIST.has(col)) return MIST.get(col);
    let cv = null;
    if (typeof col === 'string' && col[0] === '#') {
      cv = makeCanvas(64, 32);
      const g = cv.getContext('2d'),
        grad = g?.createRadialGradient?.(32, 16, 2, 32, 16, 32);
      if (grad && g.setTransform) {
        grad.addColorStop(0, col);
        grad.addColorStop(1, col + '00');
        g.setTransform(1, 0, 0, 0.5, 0, 8);
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
      } else cv = null;
    }
    MIST.set(col, cv);
    return cv;
  }
  // Barre de boss en haut de l'écran : boss d'instance (progression du raid) ou boss mondial proche.
  function drawCanaanBossFrame(c) {
    const boss = game.world.monsters
      .filter(m => (game.world.instance ? m.boss : m.worldBoss) && m.hp > 0)
      .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    if (!boss || (Math.hypot(boss.x - P.x, boss.y - P.y) > 640 && boss.hp >= boss.mhp)) return;
    const arena = !!game.world.instance?.arena,
      d = game.world.instance && !arena ? instances[game.world.instance.index] : null,
      count = d ? (d.bosses || [d.boss]).length : 0,
      edge = d ? d.color : boss.bossColor || '#ffd36d',
      w = Math.min(520, W - 40),
      x = (W - w) / 2,
      y = 160,
      ratio = Math.max(0, boss.hp / boss.mhp),
      mode = instanceDifficulty();
    c.save();
    c.fillStyle = 'rgba(8,8,14,.82)';
    c.fillRect(x - 4, y - 24, w + 8, 46);
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.strokeRect(x - 4, y - 24, w + 8, 46);
    c.font = 'bold 14px system-ui,sans-serif';
    c.textAlign = 'left';
    c.fillStyle = '#ffe9b0';
    c.fillText((d || arena ? '☠ ' : '⭐ ') + boss.t, x + 4, y - 6);
    c.textAlign = 'right';
    c.fillStyle = '#c8c0d8';
    const label = arena
      ? CANAAN_ARENA.frameLabel(boss)
      : !d
        ? 'Boss mondial'
        : boss.secretBoss !== undefined
          ? 'Boss caché'
          : count > 1
            ? 'Boss ' + ((boss.bossStage || 0) + 1) + '/' + count
            : 'Boss';
    c.fillText(label + (mode ? ' · ' + mode.label : ''), x + w - 4, y - 6);
    c.fillStyle = '#2a1418';
    c.fillRect(x, y, w, 14);
    c.fillStyle = ratio > 0.3 ? '#c8303a' : '#ff6a3c';
    c.fillRect(x, y, w * ratio, 14);
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.fillRect(x, y, w * ratio, 4);
    c.font = 'bold 11px system-ui,sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#fff';
    c.fillText(
      Math.ceil(boss.hp) + ' / ' + boss.mhp + ' · ' + Math.round(ratio * 100) + ' %',
      x + w / 2,
      y + 11
    );
    // Bonus du boss et malus infligés par les héros, sous la barre.
    if (window.CANAAN_BUFF_BAR) CANAAN_BUFF_BAR.drawMonster(c, boss, x - 4, y + 28, w + 8);
    c.restore();
  }
  // Coffres : bois cerclé de fer et mousse pour les coffres cachés, or et gemme pour le coffre de boss.
  const CHESTS = {};
  function canaanChestSprite(kind) {
    if (CHESTS[kind]) return CHESTS[kind];
    const boss = kind === 'boss',
      cv = makeCanvas(24, 20),
      g = cv.getContext('2d'),
      r = (x, y, w, h, col) => rect(g, x, y, w, h, col),
      wood = boss ? '#5a1a2a' : '#7a5232',
      woodLight = boss ? '#8a2a40' : '#a07040',
      woodDark = boss ? '#3a0e1a' : '#5a3a20',
      band = boss ? '#d4aa3a' : '#4a4a52',
      bandLight = boss ? '#fff0a8' : '#8a8a94';
    r(2, 9, 20, 10, wood);
    r(2, 12, 20, 1, woodDark);
    r(2, 15, 20, 1, woodDark);
    r(2, 18, 20, 1, woodDark);
    r(4, 2, 16, 1, wood);
    r(2, 3, 20, 6, wood);
    r(3, 3, 18, 1, woodLight);
    r(2, 6, 20, 1, woodLight);
    r(2, 9, 20, 1, '#2a160a');
    for (const x of [5, 17]) {
      r(x, 2, 2, 17, band);
      r(x, 2, 1, 17, bandLight);
    }
    r(2, 3, 1, 16, band);
    r(21, 3, 1, 16, band);
    r(10, 7, 4, 5, boss ? '#fff0a8' : '#d4aa3a');
    r(10, 7, 4, 1, '#fff6c8');
    r(11, 9, 2, 2, '#2a1a0a');
    if (boss) {
      r(11, 3, 2, 2, '#7de0ff');
      r(11, 3, 1, 1, '#ffffff');
      r(7, 13, 2, 2, '#ffd36d');
      r(15, 13, 2, 2, '#ffd36d');
    } else {
      r(2, 17, 6, 2, '#4a7a3a');
      r(3, 16, 3, 1, '#6a9a52');
      r(15, 2, 5, 1, '#5a8a44');
      r(19, 18, 3, 1, '#4a7a3a');
    }
    canaanPolish(cv, 1, boss ? 3 : 1);
    CHESTS[kind] = canaanOutline(cv, 1);
    return CHESTS[kind];
  }
  // Dessine un coffre au sol, avec son éclat et sa lueur ; le coffre de boss est surmonté d'un rayon de lumière.
  function drawCanaanChest(c, x, y, boss, seed = 0) {
    const spr = canaanChestSprite(boss ? 'boss' : 'secret'),
      s = boss ? 2.6 : 2,
      w = spr.width * s,
      h = spr.height * s;
    c.save();
    c.fillStyle = 'rgba(10,8,6,.35)';
    c.beginPath();
    c.ellipse(x, y + h * 0.42, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
    c.fill();
    if (boss) {
      c.globalAlpha = 0.18 + Math.sin(time * 0.05) * 0.06;
      c.fillStyle = '#fff0a8';
      c.fillRect(x - w * 0.3, y - 260, w * 0.6, 260);
      c.globalAlpha = 1;
    }
    c.imageSmoothingEnabled = false;
    c.drawImage(spr, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
    // Éclat qui passe sur le couvercle de temps en temps.
    const cycle = (time + seed * 37) % (boss ? 70 : 150);
    if (cycle < 18) {
      const k = Math.sin((cycle / 18) * Math.PI),
        sx = x - w * 0.3 + (cycle / 18) * w * 0.6,
        sy = y - h * 0.28;
      c.globalAlpha = k;
      c.fillStyle = '#ffffff';
      c.fillRect(sx - 1, sy - 5 * k, 2, 10 * k);
      c.fillRect(sx - 5 * k, sy - 1, 10 * k, 2);
      c.globalAlpha = 1;
    }
    c.restore();
    canaanLight(x, y - h * 0.2, boss ? 200 : 80, boss ? '#fff0a8' : '#ffd36b');
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    canaanOutline,
    canaanPolish,
    canaanActorSprite: actor,
    canaanActorPortrait: actorPortrait,
    drawCanaanActor,
    canaanLight,
    resetCanaanLights,
    drawCanaanLighting,
    drawCanaanBossFrame,
    drawCanaanChest
  });
})();
