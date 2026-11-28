// Décor des donjons et des raids : objets contre les murs (torches, bannières, chaînes…), objets au sol (os, caisses,
// braseros, statues…), pièces maîtresses, marques au sol et grilles, à la palette de chaque instance.
// scripts/dungeons/render.js appelle CANAAN_DUNGEON_DECOR.create(outils) une fois.
(() => {
  'use strict';
  function create(scene) {
    const { canvas, rect, mixHex } = scene;

    // ---------------------------------------------------------------- Décor
    function R(c, x, y, w, h, col) {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function flame(c, x, y, s, cols, seed = 0) {
      const f = Math.round(Math.sin(time * 0.23 + seed) * 2 * s),
        l = Math.round(Math.sin(time * 0.31 + seed * 2) * s);
      R(c, x - 5 * s, y - 8 * s + l, 10 * s, 9 * s, cols[0]);
      R(c, x - 3.5 * s, y - 14 * s + f, 7 * s, 9 * s, cols[1]);
      R(c, x - 2 * s, y - 18 * s + f, 4 * s, 6 * s, cols[1]);
      R(c, x - 2 * s, y - 7 * s, 4 * s, 6 * s, cols[2]);
    }
    function drawWallProp(c, p, th) {
      const X = p.x * TS,
        Y = p.y * TS,
        cx = X + 24,
        seed = p.x * 3 + p.y;
      switch (p.kind) {
        case 'torch':
        case 'sconce':
          R(c, cx - 2, Y + 24, 4, 14, '#4a3324');
          R(c, cx - 6, Y + 20, 12, 5, p.kind === 'sconce' ? th.pillar[1] : '#6f5137');
          flame(c, cx, Y + 20, 1, th.flame, seed);
          canaanLight(cx, Y + 30, 190, th.flame[1]);
          break;
        case 'lantern':
          R(c, cx - 1, Y + 6, 2, 14, '#2a2a2e');
          R(c, cx - 7, Y + 20, 14, 16, '#3a3a40');
          R(c, cx - 5, Y + 22, 10, 12, '#ffcf6a');
          R(c, cx - 2, Y + 25, 4, 6, '#fff6c5');
          canaanLight(cx, Y + 32, 170, '#ffcf6a');
          break;
        case 'banner':
          R(c, X + 8, Y + 10, 32, 3, '#3a2a1c');
          R(c, X + 11, Y + 13, 26, 28, th.banner[0]);
          R(c, X + 11, Y + 41, 8, 5, th.banner[0]);
          R(c, X + 29, Y + 41, 8, 5, th.banner[0]);
          R(c, X + 20, Y + 18, 8, 12, th.banner[1]);
          R(c, X + 17, Y + 22, 14, 4, th.banner[1]);
          R(c, X + 11, Y + 13, 26, 2, th.banner[1]);
          break;
        case 'roots':
          for (let k = 0; k < 4; k++) {
            const rx = X + 6 + k * 11,
              len = 14 + ((seed + k * 7) % 20);
            R(c, rx, Y + 10, 3, len, '#3b2a1a');
            R(c, rx + 2, Y + 10 + len - 6, 3, 6, '#2e2014');
          }
          break;
        case 'beam':
          R(c, X + 4, Y + 8, 7, 40, '#5e4430');
          R(c, X + 37, Y + 8, 7, 40, '#5e4430');
          R(c, X + 2, Y + 8, 44, 7, '#7a5a3e');
          R(c, X + 2, Y + 8, 44, 2, '#9a7a56');
          break;
        case 'mithril': {
          const glow = 0.6 + Math.sin(time * 0.05 + seed) * 0.25;
          c.globalAlpha = glow;
          R(c, X + 12, Y + 22, 6, 10, '#7de0ff');
          R(c, X + 20, Y + 16, 5, 16, '#c8f7ff');
          R(c, X + 27, Y + 24, 7, 8, '#7de0ff');
          R(c, X + 21, Y + 18, 2, 6, '#ffffff');
          c.globalAlpha = 1;
          canaanLight(cx, Y + 30, 120, '#7de0ff');
          break;
        }
        case 'chains':
          for (const ox of [12, 32])
            for (let k = 0; k < 5; k++) R(c, X + ox + (k % 2), Y + 10 + k * 6, 4 - (k % 2) * 2, 5, '#6a6a72');
          R(c, X + 10, Y + 40, 8, 4, '#4a4a52');
          R(c, X + 30, Y + 40, 8, 4, '#4a4a52');
          break;
        case 'skulls':
          R(c, X + 6, Y + 18, 36, 20, '#1a1214');
          for (const ox of [10, 22, 34]) {
            R(c, X + ox - 3, Y + 24, 8, 7, '#d8d0b8');
            R(c, X + ox - 2, Y + 26, 2, 2, '#1a1214');
            R(c, X + ox + 2, Y + 26, 2, 2, '#1a1214');
          }
          break;
        case 'furnace': {
          R(c, X + 4, Y + 12, 40, 36, '#2a1a14');
          R(c, X + 10, Y + 22, 28, 26, '#140806');
          const f = 0.75 + Math.sin(time * 0.12 + seed) * 0.2;
          c.globalAlpha = f;
          R(c, X + 12, Y + 30, 24, 18, '#e5522e');
          R(c, X + 16, Y + 34, 16, 14, '#f9a640');
          R(c, X + 20, Y + 38, 8, 10, '#fff1b5');
          c.globalAlpha = 1;
          canaanLight(cx, Y + 42, 230, '#ff7a2a');
          break;
        }
      }
    }
    function drawFloorProp(c, p, th) {
      const cx = p.x * TS + 24,
        by = p.y * TS + 40,
        seed = p.x * 5 + p.y * 3;
      const [pc, pd, pl] = th.pillar;
      switch (p.kind) {
        case 'pillar':
          R(c, cx - 22, by - 8, 44, 10, pd);
          R(c, cx - 17, by - 70, 34, 64, pc);
          R(c, cx - 17, by - 70, 6, 64, pl);
          R(c, cx + 9, by - 70, 8, 64, pd);
          R(c, cx - 22, by - 80, 44, 12, pl);
          R(c, cx - 20, by - 70, 40, 3, pd);
          break;
        case 'pillarlight': {
          R(c, cx - 20, by - 8, 40, 10, pd);
          const a = 0.35 + Math.sin(time * 0.04 + seed) * 0.12;
          c.globalAlpha = a;
          R(c, cx - 12, by - 130, 24, 124, th.flame[1]);
          R(c, cx - 5, by - 130, 10, 124, '#ffffff');
          c.globalAlpha = 1;
          canaanLight(cx, by - 30, 180, th.flame[1]);
          break;
        }
        case 'statue':
        case 'angelstatue':
          R(c, cx - 20, by - 12, 40, 14, pd);
          R(c, cx - 16, by - 16, 32, 6, pl);
          R(c, cx - 10, by - 60, 20, 46, pc);
          R(c, cx - 7, by - 74, 14, 14, pc);
          R(c, cx - 7, by - 74, 4, 14, pl);
          R(c, cx - 14, by - 54, 6, 24, pc);
          R(c, cx + 8, by - 54, 6, 24, pd);
          if (p.kind === 'angelstatue') {
            R(c, cx - 30, by - 66, 16, 34, pl);
            R(c, cx + 14, by - 66, 16, 34, pl);
            R(c, cx - 8, by - 80, 16, 3, '#d4aa3a');
          }
          break;
        case 'brazier':
          R(c, cx - 14, by - 4, 4, 8, '#2a2a2e');
          R(c, cx + 10, by - 4, 4, 8, '#2a2a2e');
          R(c, cx - 4, by - 12, 8, 14, '#3a3a40');
          R(c, cx - 18, by - 22, 36, 10, '#4a4a52');
          R(c, cx - 18, by - 22, 36, 3, '#6a6a72');
          if (p.still) break;
          flame(c, cx, by - 22, 1.6, th.flame, seed);
          canaanLight(cx, by - 30, 220, th.flame[1]);
          break;
        case 'candles':
          for (let k = 0; k < 4; k++) {
            const x = cx - 16 + k * 10,
              h = 10 + ((seed + k * 5) % 10);
            R(c, x, by - h, 5, h, '#e8dcc0');
            flame(c, x + 2.5, by - h, 0.45, th.flame, seed + k);
          }
          canaanLight(cx, by - 10, 100, th.flame[1]);
          break;
        case 'bones':
          R(c, cx - 16, by - 4, 18, 4, '#d8d0b8');
          R(c, cx - 18, by - 6, 4, 8, '#e8e0c8');
          R(c, cx + 2, by - 6, 4, 8, '#e8e0c8');
          R(c, cx + 6, by - 12, 10, 8, '#e0d8c0');
          R(c, cx + 8, by - 10, 2, 2, '#2a2420');
          R(c, cx + 12, by - 10, 2, 2, '#2a2420');
          break;
        case 'bonepile':
          for (let k = 0; k < 6; k++) {
            const x = cx - 20 + (k % 3) * 14,
              y = by - 10 - Math.floor(k / 3) * 9;
            R(c, x, y, 12, 9, k % 2 ? '#d8d0b8' : '#c8bea4');
            R(c, x + 2, y + 3, 2, 2, '#2a2420');
            R(c, x + 7, y + 3, 2, 2, '#2a2420');
          }
          break;
        case 'mushroom': {
          const g = 0.7 + Math.sin(time * 0.04 + seed) * 0.25;
          for (let k = 0; k < 3; k++) {
            const x = cx - 14 + k * 12,
              h = 8 + k * 4;
            R(c, x + 2, by - h, 4, h, '#e8dcc0');
            c.globalAlpha = g;
            R(c, x - 3, by - h - 6, 14, 6, '#4fd8c0');
            R(c, x - 1, by - h - 8, 10, 3, '#9ff8e8');
            c.globalAlpha = 1;
          }
          canaanLight(cx, by - 10, 90, '#4fd8c0');
          break;
        }
        case 'burrow':
          R(c, cx - 20, by - 12, 40, 16, '#7a6248');
          R(c, cx - 16, by - 10, 32, 12, '#120c08');
          R(c, cx - 12, by - 12, 24, 3, '#2a1e14');
          break;
        case 'crate':
          R(c, cx - 20, by - 22, 22, 22, '#7a5536');
          R(c, cx - 20, by - 22, 22, 3, '#a37a4d');
          R(c, cx - 20, by - 12, 22, 2, '#5d4330');
          R(c, cx + 4, by - 26, 16, 26, '#6a4a30');
          R(c, cx + 4, by - 26, 16, 3, '#8a6a46');
          R(c, cx + 4, by - 18, 16, 2, '#3e3a3a');
          R(c, cx + 4, by - 8, 16, 2, '#3e3a3a');
          break;
        case 'rubble':
          R(c, cx - 18, by - 8, 14, 10, th.wall.face);
          R(c, cx - 2, by - 12, 16, 14, th.wall.light);
          R(c, cx + 10, by - 6, 10, 8, th.wall.dark);
          break;
        case 'minecart':
          R(c, cx - 22, by - 26, 44, 22, '#4a4a52');
          R(c, cx - 22, by - 26, 44, 3, '#7a7a84');
          R(c, cx - 18, by - 32, 36, 8, '#5a5a62');
          R(c, cx - 12, by - 36, 8, 6, '#9fb6c9');
          R(c, cx + 2, by - 38, 8, 8, '#7de0ff');
          R(c, cx - 16, by - 4, 8, 8, '#1c1c20');
          R(c, cx + 8, by - 4, 8, 8, '#1c1c20');
          canaanLight(cx, by - 30, 70, '#7de0ff');
          break;
        case 'ore':
          R(c, cx - 18, by - 12, 36, 14, '#4a4a52');
          R(c, cx - 12, by - 18, 22, 8, '#5d6673');
          R(c, cx - 8, by - 16, 4, 4, '#7de0ff');
          R(c, cx + 4, by - 10, 4, 4, '#c8f7ff');
          R(c, cx - 14, by - 6, 3, 3, '#7de0ff');
          break;
        case 'pickaxe':
          R(c, cx - 2, by - 30, 4, 30, '#6a4a30');
          R(c, cx - 14, by - 32, 28, 5, '#8a8a94');
          R(c, cx - 16, by - 30, 4, 4, '#c0c0c8');
          R(c, cx + 12, by - 30, 4, 4, '#c0c0c8');
          break;
        case 'cage':
          R(c, cx - 18, by - 48, 36, 4, '#3a3a40');
          R(c, cx - 18, by - 4, 36, 4, '#3a3a40');
          for (let k = 0; k < 5; k++) R(c, cx - 18 + k * 8, by - 46, 3, 44, '#4a4a52');
          R(c, cx - 8, by - 12, 14, 8, '#d8d0b8');
          R(c, cx - 1, by - 66, 2, 18, '#4a4a52');
          break;
        case 'spikes':
          for (let k = 0; k < 4; k++) {
            c.fillStyle = '#8a8a94';
            c.beginPath();
            c.moveTo(cx - 18 + k * 11, by);
            c.lineTo(cx - 13 + k * 11, by - 16);
            c.lineTo(cx - 8 + k * 11, by);
            c.fill();
          }
          R(c, cx - 20, by - 2, 40, 4, '#3a3a40');
          break;
        case 'rack':
          R(c, cx - 22, by - 34, 4, 34, '#5e4430');
          R(c, cx + 18, by - 34, 4, 34, '#5e4430');
          R(c, cx - 22, by - 34, 44, 4, '#7a5a3e');
          for (let k = 0; k < 3; k++) {
            R(c, cx - 12 + k * 11, by - 44, 3, 40, '#c0c0c8');
            R(c, cx - 15 + k * 11, by - 12, 9, 3, '#8a6a46');
          }
          break;
        case 'anvil':
          R(c, cx - 12, by - 14, 24, 16, '#5e4430');
          R(c, cx - 8, by - 22, 16, 8, '#2a2a2e');
          R(c, cx - 20, by - 30, 40, 9, '#3a3a40');
          R(c, cx - 20, by - 30, 40, 2, '#6a6a72');
          R(c, cx + 20, by - 28, 6, 5, '#3a3a40');
          R(c, cx - 2, by - 44, 4, 14, '#6a4a30');
          R(c, cx - 8, by - 46, 16, 6, '#6a6a72');
          break;
        case 'ingots': {
          const g = 0.65 + Math.sin(time * 0.06 + seed) * 0.25;
          c.globalAlpha = g;
          for (let k = 0; k < 3; k++) R(c, cx - 16 + k * 11, by - 8, 10, 6, '#ff9a3c');
          R(c, cx - 10, by - 14, 10, 6, '#ffd36b');
          R(c, cx + 1, by - 14, 10, 6, '#ffb14a');
          c.globalAlpha = 1;
          canaanLight(cx, by - 10, 80, '#ff8a3c');
          break;
        }
        case 'dragonskull':
          R(c, cx - 22, by - 24, 44, 22, '#d8d0b8');
          R(c, cx - 18, by - 4, 36, 6, '#c8bea4');
          R(c, cx - 14, by - 18, 8, 7, '#1a1214');
          R(c, cx + 6, by - 18, 8, 7, '#1a1214');
          R(c, cx - 30, by - 36, 8, 18, '#e8e0c8');
          R(c, cx + 22, by - 36, 8, 18, '#e8e0c8');
          for (let k = 0; k < 4; k++) R(c, cx - 14 + k * 8, by - 4, 3, 6, '#fff8e0');
          break;
        case 'pike':
          R(c, cx - 2, by - 56, 4, 56, '#5e4430');
          R(c, cx - 8, by - 66, 16, 13, '#d8d0b8');
          R(c, cx - 5, by - 61, 3, 3, '#1a1214');
          R(c, cx + 2, by - 61, 3, 3, '#1a1214');
          R(c, cx - 6, by - 52, 12, 3, '#8a1420');
          break;
        case 'gear': {
          const a = time * 0.02 * (seed % 2 ? 1 : -1);
          c.save();
          c.translate(cx, by - 30);
          c.rotate(a);
          c.fillStyle = pc;
          for (let k = 0; k < 8; k++) {
            c.rotate(Math.PI / 4);
            c.fillRect(-4, -28, 8, 10);
          }
          c.beginPath();
          c.arc(0, 0, 21, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = pd;
          c.beginPath();
          c.arc(0, 0, 9, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = pl;
          c.fillRect(-2, -20, 4, 10);
          c.restore();
          break;
        }
        case 'hourglass': {
          R(c, cx - 16, by - 6, 32, 6, pc);
          R(c, cx - 16, by - 58, 32, 6, pc);
          R(c, cx - 14, by - 52, 3, 46, pd);
          R(c, cx + 11, by - 52, 3, 46, pd);
          c.globalAlpha = 0.45;
          R(c, cx - 10, by - 52, 20, 46, '#bfe8ff');
          c.globalAlpha = 1;
          const sand = (time * 0.2) % 20;
          R(c, cx - 8, by - 50, 16, 18 - sand * 0.8, '#e0c070');
          R(c, cx - 1, by - 32, 2, 18, '#e0c070');
          R(c, cx - 8, by - 6 - sand, 16, sand, '#e0c070');
          break;
        }
        case 'crystal': {
          const bob = Math.sin(time * 0.05 + seed) * 4;
          c.globalAlpha = 0.85;
          c.fillStyle = th.flame[1];
          c.beginPath();
          c.moveTo(cx, by - 54 + bob);
          c.lineTo(cx + 10, by - 34 + bob);
          c.lineTo(cx, by - 14 + bob);
          c.lineTo(cx - 10, by - 34 + bob);
          c.fill();
          c.fillStyle = '#ffffff';
          c.fillRect(cx - 2, by - 46 + bob, 3, 14);
          c.globalAlpha = 0.3;
          R(c, cx - 12, by - 2, 24, 4, '#000');
          c.globalAlpha = 1;
          canaanLight(cx, by - 34, 140, th.flame[1]);
          break;
        }
        case 'orb': {
          const bob = Math.sin(time * 0.04 + seed) * 5;
          c.globalAlpha = 0.9;
          c.fillStyle = th.flame[1];
          c.beginPath();
          c.arc(cx, by - 40 + bob, 12, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(cx - 3, by - 43 + bob, 4, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          canaanLight(cx, by - 40, 150, th.flame[1]);
          break;
        }
        case 'feathers':
          for (let k = 0; k < 4; k++) {
            const x = cx - 16 + k * 10,
              y = by - 6 - (k % 2) * 6;
            R(c, x, y, 9, 3, '#ffffff');
            R(c, x + 3, y - 2, 2, 7, '#e8dcc0');
          }
          break;
      }
    }
    function drawCenterpiece(c, p, th) {
      const cx = p.x * TS + 24,
        by = p.y * TS + 44,
        [pc, pd, pl] = th.pillar;
      switch (p.kind) {
        case 'bonethrone':
          R(c, cx - 40, by - 20, 80, 22, '#c8bea4');
          R(c, cx - 30, by - 90, 60, 72, '#d8d0b8');
          for (let k = 0; k < 5; k++) {
            R(c, cx - 34 + k * 14, by - 104, 12, 12, '#e8e0c8');
            R(c, cx - 31 + k * 14, by - 100, 2, 3, '#1a1214');
            R(c, cx - 26 + k * 14, by - 100, 2, 3, '#1a1214');
          }
          R(c, cx - 20, by - 70, 40, 40, '#9a917a');
          R(c, cx - 48, by - 50, 14, 50, '#d8d0b8');
          R(c, cx + 34, by - 50, 14, 50, '#d8d0b8');
          break;
        case 'mithrilcluster': {
          const g = 0.75 + Math.sin(time * 0.04) * 0.2;
          c.globalAlpha = g;
          const shard = (x, h, w, col) => {
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(cx + x - w, by);
            c.lineTo(cx + x, by - h);
            c.lineTo(cx + x + w, by);
            c.fill();
          };
          shard(-30, 60, 14, '#5cb8e0');
          shard(28, 70, 14, '#5cb8e0');
          shard(-8, 110, 20, '#7de0ff');
          shard(12, 84, 16, '#c8f7ff');
          c.globalAlpha = 1;
          R(c, cx - 50, by - 6, 100, 10, '#3d434d');
          canaanLight(cx, by - 50, 260, '#7de0ff');
          break;
        }
        case 'altar': {
          R(c, cx - 44, by - 30, 88, 32, pd);
          R(c, cx - 48, by - 36, 96, 8, pl);
          R(c, cx - 30, by - 28, 60, 22, pc);
          flame(c, cx - 34, by - 36, 0.8, th.flame, 1);
          flame(c, cx + 34, by - 36, 0.8, th.flame, 2);
          // Disque d'éclipse : un soleil masqué par la lune.
          const y = by - 90 + Math.sin(time * 0.03) * 3;
          c.fillStyle = '#ffcc55';
          c.globalAlpha = 0.35;
          c.beginPath();
          c.arc(cx, y, 34, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          c.beginPath();
          c.arc(cx, y, 24, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#120a1c';
          c.beginPath();
          c.arc(cx + 8, y - 3, 22, 0, Math.PI * 2);
          c.fill();
          canaanLight(cx, y, 260, th.flame[1]);
          break;
        }
        case 'greatforge': {
          R(c, cx - 56, by - 80, 112, 84, '#2a1a14');
          R(c, cx - 56, by - 80, 112, 8, '#4a302a');
          R(c, cx - 36, by - 56, 72, 60, '#140806');
          const f = 0.75 + Math.sin(time * 0.1) * 0.2;
          c.globalAlpha = f;
          R(c, cx - 32, by - 34, 64, 38, '#e5522e');
          R(c, cx - 22, by - 26, 44, 30, '#f9a640');
          R(c, cx - 10, by - 18, 20, 22, '#fff1b5');
          c.globalAlpha = 1;
          R(c, cx - 20, by - 116, 40, 38, '#3a2a26');
          canaanLight(cx, by - 20, 320, '#ff6a1f');
          break;
        }
        case 'block':
          R(c, cx - 30, by - 26, 60, 28, '#3a2a26');
          R(c, cx - 30, by - 26, 60, 4, '#5a4038');
          R(c, cx - 12, by - 30, 24, 6, '#6a1a1a');
          for (const ox of [-38, 34])
            for (let k = 0; k < 8; k++) R(c, cx + ox + (k % 2), by - 100 + k * 9, 4, 7, '#6a6a72');
          R(c, cx - 44, by - 108, 88, 8, '#2a2026');
          break;
        case 'throne': {
          const gold = th.key === 'seraphin';
          R(c, cx - 50, by - 12, 100, 14, gold ? '#d4aa3a' : '#3a1414');
          R(c, cx - 30, by - 110, 60, 100, gold ? '#fff4d8' : '#5a1010');
          R(c, cx - 30, by - 110, 60, 6, gold ? '#d4aa3a' : '#d4a44a');
          R(c, cx - 22, by - 100, 44, 70, gold ? '#d4aa3a' : '#8a1420');
          R(c, cx - 42, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
          R(c, cx + 28, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
          for (let k = 0; k < 3; k++) R(c, cx - 22 + k * 18, by - 124, 8, 14, gold ? '#ffe680' : '#d4a44a');
          if (gold) {
            R(c, cx - 70, by - 96, 26, 60, '#ffffff');
            R(c, cx + 44, by - 96, 26, 60, '#ffffff');
            canaanLight(cx, by - 60, 240, '#ffe680');
          }
          break;
        }
        case 'orrery': {
          R(c, cx - 10, by - 50, 20, 52, pc);
          R(c, cx - 26, by - 6, 52, 8, pd);
          c.strokeStyle = pl;
          c.lineWidth = 3;
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.ellipse(cx, by - 80, 30 + k * 16, 10 + k * 6, 0, 0, Math.PI * 2);
            c.stroke();
            const a = time * (0.02 + k * 0.012) + k * 2;
            c.fillStyle = ['#7de0ff', '#ff7fa7', '#ffd36d'][k];
            c.beginPath();
            c.arc(cx + Math.cos(a) * (30 + k * 16), by - 80 + Math.sin(a) * (10 + k * 6), 7, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = '#fff6c0';
          c.beginPath();
          c.arc(cx, by - 80, 12, 0, Math.PI * 2);
          c.fill();
          canaanLight(cx, by - 80, 240, '#9fd8ff');
          break;
        }
        case 'scales': {
          R(c, cx - 30, by - 8, 60, 10, '#8a6a1a');
          R(c, cx - 5, by - 120, 10, 114, '#d4aa3a');
          const tilt = Math.sin(time * 0.02) * 8;
          c.save();
          c.translate(cx, by - 116);
          c.rotate((tilt * Math.PI) / 180);
          R(c, -70, -3, 140, 6, '#ffe680');
          c.restore();
          for (const s of [-1, 1]) {
            const px = cx + s * 66,
              py = by - 116 + s * tilt * 1.1;
            R(c, px - 1, py, 2, 36, '#d4aa3a');
            R(c, px - 22, py + 36, 44, 6, '#ffe680');
            R(c, px - 16, py + 42, 32, 4, '#d4aa3a');
          }
          R(c, cx - 10, by - 132, 20, 14, '#fff0a8');
          canaanLight(cx, by - 80, 280, '#fff0a8');
          break;
        }
      }
    }
    // Motifs au sol en gros pixels (art au tiers, agrandi ×3 sans lissage), peints une fois par instance.
    const decalCache = new Map();
    function fillOval(g, cx, cy, rx, ry, col) {
      g.fillStyle = col;
      for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
        const half = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
        g.fillRect(Math.round(cx - half), cy + y, Math.max(1, Math.round(half * 2)), 1);
      }
    }
    function ringOval(g, cx, cy, rx, ry, col, from = 0, to = Math.PI * 2) {
      g.fillStyle = col;
      const n = Math.ceil((rx + ry) * 4);
      for (let k = 0; k <= n; k++) {
        const a = from + ((to - from) * k) / n;
        g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
      }
    }
    function decalArt(kind, th) {
      const key = kind + th.rune + th.pillar.join('');
      let cv = decalCache.get(key);
      if (cv) return cv;
      const rune = th.rune,
        deep = mixHex(rune, '#000000', 0.55);
      if (kind === 'portal') {
        // Margelle de pierre cerclée d'encre, runes gravées, bassin de lumière à la couleur de l'instance.
        cv = canvas(28, 16);
        const g = cv.getContext('2d'),
          [pc, pd, pl] = th.pillar;
        fillOval(g, 14, 8, 13.5, 7.5, '#1a1210');
        fillOval(g, 14, 8, 12.5, 6.5, pd);
        ringOval(g, 14, 8, 12, 6, pc, Math.PI, Math.PI * 2);
        ringOval(g, 14, 8, 11, 5, pl, Math.PI * 1.15, Math.PI * 1.85);
        fillOval(g, 14, 8, 9.5, 4.5, '#0a0810');
        fillOval(g, 14, 8, 8.5, 3.5, deep);
        fillOval(g, 14, 8, 5.5, 2.5, rune);
        fillOval(g, 14, 8, 2.5, 1.2, mixHex(rune, '#ffffff', 0.6));
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + 0.5;
          rect(g, Math.round(14 + Math.cos(a) * 11), Math.round(8 + Math.sin(a) * 5.5), 1, 1, rune);
        }
      } else {
        // Cercle runique gravé : deux anneaux et leur trait d'ombre, douze glyphes ; éclipse au centre.
        cv = canvas(78, 48);
        const g = cv.getContext('2d');
        for (const [rx, ry] of [
          [36, 21.5],
          [28, 16.8]
        ]) {
          ringOval(g, 39, 25, rx, ry, deep);
          ringOval(g, 39, 24, rx, ry, rune);
        }
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2,
            gx = Math.round(39 + Math.cos(a) * 32) - 1,
            gy = Math.round(24 + Math.sin(a) * 19.2) - 1;
          rect(g, gx, gy + 1, 3, 2, deep);
          rect(g, gx, gy, 3, 2, rune);
          rect(g, gx + (k % 3), gy + (k % 2), 1, 1, mixHex(rune, '#ffffff', 0.55));
        }
        if (kind === 'eclipse') {
          fillOval(g, 39, 24, 17, 10, '#e0b04a');
          fillOval(g, 44, 23, 16, 9.6, '#120a1c');
        }
      }
      decalCache.set(key, cv);
      return cv;
    }
    function drawDecal(c, dcl, th) {
      const x = dcl.x * TS + 24,
        y = dcl.y * TS + 24;
      if (dcl.kind === 'portal' || dcl.kind === 'runecircle' || dcl.kind === 'eclipse') {
        const art = decalArt(dcl.kind, th),
          portal = dcl.kind === 'portal';
        c.save();
        c.imageSmoothingEnabled = false;
        c.globalAlpha = portal ? 1 : 0.55;
        c.drawImage(art, x - art.width * 1.5, y - art.height * 1.5, art.width * 3, art.height * 3);
        if (portal) {
          // Bassin qui pulse et étincelles qui tournent autour de la margelle, calées sur la grille des pixels.
          c.globalAlpha = 0.18 + Math.sin(time * 0.05) * 0.1;
          c.globalCompositeOperation = 'lighter';
          c.drawImage(art, x - art.width * 1.5, y - art.height * 1.5, art.width * 3, art.height * 3);
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = 0.9;
          c.fillStyle = th.rune;
          for (let k = 0; k < 6; k++) {
            const a = time * 0.04 + k,
              sx = Math.round((x + Math.cos(a) * 42) / 3) * 3,
              sy = Math.round((y + Math.sin(a) * 23 - 6) / 3) * 3;
            c.fillRect(sx, sy, 3, 3);
          }
          canaanLight(x, y, 170, th.rune);
        }
        c.restore();
      } else if (dcl.kind === 'splat') {
        c.save();
        c.globalAlpha = 0.5;
        c.fillStyle = th.hazard.style === 'blood' ? '#5a0a10' : '#2a1030';
        c.beginPath();
        c.ellipse(x, y, 16, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.fillRect(x + 12, y - 2, 10, 4);
        c.fillRect(x - 20, y + 4, 6, 3);
        c.restore();
      }
    }
    function drawGate(c, g, th) {
      const xs = g.cells.map(cl => cl[0]),
        ys = g.cells.map(cl => cl[1]),
        X = Math.min(...xs) * TS,
        Y = Math.min(...ys) * TS,
        w = (Math.max(...xs) - Math.min(...xs) + 1) * TS,
        h = (Math.max(...ys) - Math.min(...ys) + 1) * TS;
      if (th.gate === 'barrier') {
        const a = 0.45 + Math.sin(time * 0.08) * 0.15;
        c.save();
        c.globalAlpha = a;
        c.fillStyle = th.rune;
        c.fillRect(X, Y, w, h);
        c.globalAlpha = 0.9;
        c.fillStyle = '#ffffff';
        for (let k = 0; k < 6; k++) {
          const t = (time * 0.6 + k * 23) % 48;
          if (w > h) c.fillRect(X + ((k * 29 + time) % w), Y + t, 3, 6);
          else c.fillRect(X + t, Y + ((k * 29 + time) % h), 6, 3);
        }
        c.restore();
        canaanLight(X + w / 2, Y + h / 2, 160, th.rune);
        return;
      }
      // Herse de fer.
      c.fillStyle = '#1c1c20';
      c.fillRect(X, Y, w, h);
      c.fillStyle = '#5a5a62';
      if (w >= h) {
        for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y, 5, h);
        for (let y = Y + 8; y < Y + h; y += 16) c.fillRect(X, y, w, 4);
      } else {
        for (let y = Y + 4; y < Y + h; y += 12) c.fillRect(X, y, w, 5);
        for (let x = X + 8; x < X + w; x += 16) c.fillRect(x, Y, 4, h);
      }
      c.fillStyle = '#8a8a94';
      if (w >= h) for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y + h - 6, 5, 6);
    }

    return Object.freeze({
      R,
      flame,
      drawWallProp,
      drawFloorProp,
      drawCenterpiece,
      drawDecal,
      drawGate
    });
  }
  window.CANAAN_DUNGEON_DECOR = Object.freeze({ create });
})();
