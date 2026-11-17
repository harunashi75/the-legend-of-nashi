// Vie dans l'eau profonde : bancs de poissons sous la surface (mer et lacs), dauphins qui sautent et baleines
// qui viennent souffler en pleine mer. Décoratif, calculé chez chaque joueur, seulement autour de l'écran.
(() => {
  'use strict';
  const creatures = [];
  const DEEP = new Set([0, 18]);
  const tileAt = (x, y) => game.world.overworld?.[Math.floor(y / TS)]?.[Math.floor(x / TS)];
  // Eau profonde tout autour (rayon en cases) : la pleine mer pour les dauphins et les baleines.
  function open(x, y, radius, onlySea = true) {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        const t = tileAt(x + dx * TS, y + dy * TS);
        if (onlySea ? t !== 0 : !DEEP.has(t)) return false;
      }
    return true;
  }
  const visible = (x, y, margin) =>
    Math.abs(x - camX - W / 2) < W / 2 + margin && Math.abs(y - camY - H / 2) < H / 2 + margin;
  const TARGET = { school: 7, dolphin: 3, whale: 1 };
  let clock = 0;
  function spawn() {
    const count = kind => creatures.filter(c => c.kind === kind).length;
    for (const kind of ['school', 'dolphin', 'whale']) {
      if (count(kind) >= TARGET[kind]) continue;
      for (let tries = 0; tries < 12; tries++) {
        const x = camX - 200 + Math.random() * (W + 400),
          y = camY - 200 + Math.random() * (H + 400);
        const ok =
          kind === 'school' ? open(x, y, 1, false) : kind === 'dolphin' ? open(x, y, 3) : open(x, y, 6);
        if (!ok) continue;
        const a = Math.random() * Math.PI * 2;
        creatures.push({
          kind,
          x,
          y,
          a,
          speed: kind === 'school' ? 0.5 : kind === 'dolphin' ? 1.4 : 0.35,
          t: Math.floor(Math.random() * 400),
          fish:
            kind === 'school'
              ? Array.from({ length: 6 + Math.floor(Math.random() * 5) }, () => [
                  Math.random() * Math.PI * 2,
                  8 + Math.random() * 22,
                  0.6 + Math.random() * 0.8
                ])
              : null,
          glow: tileAt(x, y) === 18
        });
        break;
      }
    }
  }
  let last = null;
  function update() {
    const ticks = last === null ? 1 : Math.max(0, Math.min(5, time - last));
    last = time;
    if (!ticks) return;
    if (++clock % 20 === 0) spawn();
    for (let i = creatures.length - 1; i >= 0; i--) {
      const c = creatures[i];
      if (!visible(c.x, c.y, 600)) {
        creatures.splice(i, 1);
        continue;
      }
      for (let k = 0; k < ticks; k++) {
        c.t++;
        // Nage : petit changement de cap, demi-tour devant la côte.
        c.a += Math.sin(c.t * 0.013 + c.x * 0.001) * 0.01;
        const nx = c.x + Math.cos(c.a) * c.speed,
          ny = c.y + Math.sin(c.a) * c.speed,
          ok =
            c.kind === 'school'
              ? DEEP.has(tileAt(nx + Math.cos(c.a) * 30, ny + Math.sin(c.a) * 30))
              : open(nx + Math.cos(c.a) * 60, ny + Math.sin(c.a) * 60, c.kind === 'whale' ? 3 : 1);
        if (!ok) c.a += Math.PI * (0.6 + Math.random() * 0.4);
        else {
          c.x = nx;
          c.y = ny;
        }
      }
    }
  }
  function fishShape(g, x, y, a, size, col) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-size * 0.8, 0);
    g.lineTo(-size * 1.5, -size * 0.45);
    g.lineTo(-size * 1.5, size * 0.45);
    g.fill();
    g.restore();
  }
  function splash(g, x, y, n, t) {
    g.fillStyle = '#ffffff';
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI - Math.PI,
        r = 4 + t * 16;
      g.globalAlpha = (1 - t) * 0.85;
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.7 - t * 6), 3, 3);
    }
  }
  function draw(g) {
    if (game.world.instance || canaanInHouse(P.x / TS, P.y / TS)) return;
    update();
    g.save();
    for (const c of creatures) {
      if (!visible(c.x, c.y, 120)) continue;
      if (c.kind === 'school') {
        // Ombres de poissons sous la surface, qui tournent en banc.
        for (const [phase, rad, sp] of c.fish) {
          const a = phase + c.t * 0.02 * sp,
            x = c.x + Math.cos(a) * rad,
            y = c.y + Math.sin(a) * rad * 0.6;
          g.globalAlpha = 0.32;
          fishShape(g, x, y, a + Math.PI / 2, 7, c.glow ? '#e0d0ff' : '#0a2436');
        }
      } else if (c.kind === 'dolphin') {
        // Dauphin : ombre sous l'eau, puis un saut toutes les quelques secondes.
        const cycle = c.t % 260,
          jumping = cycle > 200;
        if (!jumping) {
          g.globalAlpha = 0.35;
          fishShape(g, c.x, c.y, c.a, 18, '#0a2436');
        } else {
          const t = (cycle - 200) / 60,
            x = c.x + Math.cos(c.a) * (t - 0.5) * 70,
            base = c.y + Math.sin(c.a) * (t - 0.5) * 70,
            y = base - Math.sin(t * Math.PI) * 46,
            dir = Math.cos(c.a) >= 0 ? 1 : -1;
          g.globalAlpha = 1;
          g.save();
          g.translate(x, y);
          g.scale(dir, 1);
          g.rotate((t - 0.5) * 1.9);
          g.fillStyle = '#6a8aa8';
          g.beginPath();
          g.ellipse(0, 0, 20, 7, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#c8dcea';
          g.beginPath();
          g.ellipse(2, 3, 14, 3, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#5a7a98';
          g.beginPath();
          g.moveTo(-2, -6);
          g.lineTo(4, -14);
          g.lineTo(7, -5);
          g.fill();
          g.beginPath();
          g.moveTo(-18, 0);
          g.lineTo(-27, -7);
          g.lineTo(-27, 7);
          g.fill();
          g.fillRect(19, -1, 6, 3);
          g.fillStyle = '#1a1418';
          g.fillRect(12, -3, 2, 2);
          g.restore();
          if (t < 0.25) splash(g, c.x + Math.cos(c.a) * -35, c.y + Math.sin(c.a) * -35, 7, t * 4);
          if (t > 0.75) splash(g, c.x + Math.cos(c.a) * 35, c.y + Math.sin(c.a) * 35, 7, (t - 0.75) * 4);
        }
      } else {
        // Baleine : grande ombre ; elle remonte souffler, montre son dos, puis plonge en levant la queue.
        const cycle = c.t % 900;
        g.globalAlpha = 0.3;
        g.save();
        g.translate(c.x, c.y);
        g.rotate(c.a);
        g.fillStyle = '#081a28';
        g.beginPath();
        g.ellipse(0, 0, 70, 22, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(-62, 0);
        g.lineTo(-92, -18);
        g.lineTo(-92, 18);
        g.fill();
        g.restore();
        if (cycle > 600 && cycle < 820) {
          const t = (cycle - 600) / 220,
            rise = Math.sin(Math.min(1, t * 1.4) * Math.PI);
          g.globalAlpha = Math.min(1, rise * 1.4);
          g.fillStyle = '#3e5468';
          g.beginPath();
          g.ellipse(c.x, c.y - 4, 46, 9 + rise * 6, 0, Math.PI, 0);
          g.fill();
          g.fillStyle = '#5a7088';
          g.fillRect(Math.round(c.x - 20), Math.round(c.y - 12 - rise * 5), 30, 2);
          // Souffle : jet d'eau qui monte puis retombe.
          if (t > 0.2 && t < 0.6) {
            const s = (t - 0.2) / 0.4;
            g.fillStyle = '#ffffff';
            for (let k = 0; k < 14; k++) {
              const h = Math.sin(s * Math.PI) * 50 * (0.6 + (k % 5) * 0.1),
                spread = (k - 7) * 2.2 * s;
              g.globalAlpha = (1 - s) * 0.85;
              g.fillRect(
                Math.round(c.x + 18 + spread),
                Math.round(c.y - 18 - h + Math.abs(spread) * 0.8),
                3,
                3
              );
            }
          }
        } else if (cycle >= 820 && cycle < 880) {
          const t = (cycle - 820) / 60,
            dir = Math.cos(c.a) >= 0 ? -1 : 1,
            tx = c.x + dir * 50,
            lift = Math.sin(t * Math.PI) * 34;
          g.globalAlpha = 1;
          g.fillStyle = '#3e5468';
          g.beginPath();
          g.moveTo(tx, c.y);
          g.lineTo(tx - 4, c.y - lift);
          g.lineTo(tx - 22, c.y - lift - 10);
          g.lineTo(tx, c.y - lift + 2);
          g.lineTo(tx + 22, c.y - lift - 10);
          g.lineTo(tx + 4, c.y - lift);
          g.closePath();
          g.fill();
          if (t > 0.7) splash(g, tx, c.y, 9, (t - 0.7) / 0.3);
        }
      }
    }
    g.restore();
  }
  window.CANAAN_SEA = Object.freeze({ draw, creatures: () => creatures, update });
})();
