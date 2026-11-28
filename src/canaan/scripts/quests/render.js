// Dessin des quêtes, dans le style des donjons : objets des lieux et des énigmes (cristaux, miroirs, sceaux,
// coquillages…), décor propre à chaque lieu, PNJ et leurs marques (! et ?), bulles, annonces au sol des gardiens,
// trouvaille brandie, Lumi et les auras au-dessus des héros. Aucune règle ici : tout est lu dans quests.js et sites.js.
// quests.js appelle CANAAN_QUEST_RENDER.create(scène) une fois ; ses outils de dessin (art) servent aussi aux
// objectifs de terrain (quest-field.js).
(() => {
  'use strict';
  function create(scene) {
    const {
      T,
      SITES,
      NPCS,
      now,
      guest,
      stateOf,
      px,
      py,
      here,
      WAYSTONE,
      CONSTELLATION,
      beamOf,
      leafAt,
      FIGHTS,
      zones,
      heartFlag,
      guardianOf,
      guardianDue,
      tradeAt,
      hasLoupe,
      watchFanfare,
      stepOf,
      at,
      nearest,
      usable,
      label,
      errand,
      present,
      npcState,
      tracker
    } = scene;
    // État de quests.js relu à chaque usage (variables réassignées ou posées plus tard).
    const LIVE = scene.state;

    // Annonces au sol chez l'hôte : remplissage rouge qui monte jusqu'à l'explosion (les invités voient l'anneau).
    function drawZones(c) {
      for (const z of zones) {
        const k = Math.min(1, (now() - z.start) / Math.max(1, z.at - z.start));
        c.globalAlpha = 0.16 + 0.24 * k;
        c.fillStyle = '#ff2a1a';
        c.beginPath();
        c.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    }
    function drawShell(c, o) {
      const st = stateOf(game.hero);
      if (st.shells.includes(o.shell)) return;
      const d = Math.hypot(P.x - o.x, P.y - o.y),
        loupe = hasLoupe(game.hero);
      // Caché dans l'herbe : un éclat de temps en temps quand on passe à côté, visible de près (de loin avec la loupe).
      if (d > (loupe ? 14 : 2.6) * T) {
        if (d < 6 * T && (time + o.x) % 150 < 8) glow(c, o.x, o.y - 4, 16, '#ffe8f4', 0.7);
        return;
      }
      if (loupe) glow(c, o.x, o.y - 4, 30 + Math.sin(time * 0.1) * 6, '#ffd0ec', 0.45);
      shadowAt(c, o.x, o.y + 8, 9, 3);
      rune(c, o.x, o.y + 6 + Math.sin(time * 0.08) * 1.5, '🐚', '#ffffff', 18);
      if (time % 40 < 20) R(c, o.x + 6, o.y - 10, 2, 2, '#ffffff');
    }
    function drawSeal(c, site, o) {
      const q = site.quest,
        due = guardianDue(game.hero, q),
        fight = !!FIGHTS[site.id] || game.world.monsters.some(m => m.boss && m.t === guardianOf(q).name),
        done = stateOf(game.hero).flags[heartFlag(q)];
      shadowAt(c, o.x, o.y + 10, 20, 6);
      block(c, o.x - 16, o.y - 2, 32, 12, PAL.dark);
      if (done) return rune(c, o.x, o.y + 7, '✦', '#ffe9a0', 14);
      // Sceau de l'Ombre : une rune violette qui pulse, plus fort quand le gardien attend ce héros.
      const pulse = 0.5 + 0.5 * Math.sin(time * (due ? 0.12 : 0.05));
      glow(c, o.x, o.y + 2, due ? 40 : 22, '#8a4aff', fight ? 0.15 : 0.25 + 0.3 * pulse);
      rune(c, o.x, o.y + 8, '۞', fight ? '#3a2a4e' : '#c8a0ff', 16);
    }
    // Le héros brandit sa trouvaille au-dessus de sa tête.
    function drawRaised(c) {
      if (!LIVE.raised || time >= LIVE.raised.until || P.dead) return;
      const k = Math.min(1, (LIVE.raised.until - time) / 20),
        y = P.y - 78 - Math.min(14, (170 - (LIVE.raised.until - time)) * 0.8);
      c.globalAlpha = k;
      glow(c, P.x, y - 8, 46, '#fff2b0', 0.6);
      for (let i = 0; i < 8; i++) {
        const a = time * 0.03 + (i * Math.PI) / 4;
        R(c, P.x + Math.cos(a) * 28, y - 8 + Math.sin(a) * 28, 3, 3, '#fff6c8');
      }
      rune(c, P.x, y, LIVE.raised.icon, '#ffffff', 28);
      c.globalAlpha = 1;
    }
    // ---------------------------------------------------------------- Dessin
    const R = (c, x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const visible = (x, y, m = 80) =>
      Math.abs(x - camX - W / 2) < W / 2 + m && Math.abs(y - camY - H / 2) < H / 2 + m;
    const prompt = (c, x, y, text) => drawCanaanPrompt(c, '[E] ' + text, x, y);
    function glow(c, x, y, r, col, a = 0.35) {
      const g = c.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = a;
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
      c.globalAlpha = 1;
    }
    // ---------------------------------------------------------------- Dessin des objets (style des donjons)
    // Comme les objets des donjons et du camp : volumes en trois tons (reflet en haut à gauche, ombre à droite),
    // contour sombre, ombre portée au sol, flamme et lueurs des torches (CANAAN_TILE_KIT).
    const OUT = '#22160e',
      FLAME = ['#e5522e', '#f9a640', '#fff1b5'],
      PAL = {
        stone: ['#8a8a84', '#c4c0b4', '#5e5e5a'],
        dark: ['#5a5e66', '#8a909a', '#363a42'],
        wood: ['#6e4c32', '#9a7248', '#43301f'],
        sand: ['#c8a46c', '#ecd09a', '#8a6a3a'],
        iron: ['#4a4a52', '#6a6a72', '#2a2a30'],
        gold: ['#c89a30', '#f0d070', '#8a6418'],
        lilac: ['#9a88c8', '#c8b8f0', '#6a5a98'],
        moss: ['#5a6a48', '#7a8a62', '#3a4630']
      };
    function shadowAt(c, x, y, rx, ry) {
      c.globalAlpha = 0.3;
      c.fillStyle = '#0a0806';
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    // Bloc en trois tons avec contour : base, reflet (haut et gauche), ombre (droite et bas).
    function block(c, x, y, w, h, p) {
      R(c, x - 1, y - 1, w + 2, h + 2, OUT);
      R(c, x, y, w, h, p[0]);
      R(c, x, y, w, 2, p[1]);
      R(c, x, y, 2, h, p[1]);
      R(c, x + w - 3, y + 2, 3, h - 2, p[2]);
      R(c, x + 2, y + h - 2, w - 5, 2, p[2]);
    }
    function rune(c, x, y, text, col, size = 14) {
      c.font = canaanFont(size, '');
      c.textAlign = 'center';
      c.fillStyle = col;
      c.fillText(text, x, y);
    }
    function torchFlame(c, x, y, s = 1) {
      CANAAN_TILE_KIT.flame(c, x, y, s, FLAME, x);
      canaanLight(x, y - 6, 120 * s, '#ffcf6a');
    }
    // Socle bas avec un objet ou un symbole posé dessus.
    function pedestalArt(c, x, y, p, top) {
      shadowAt(c, x, y + 12, 18, 5);
      block(c, x - 14, y - 4, 28, 18, p);
      block(c, x - 17, y - 9, 34, 6, p);
      if (top) rune(c, x, y - 13, top, '#fff6d0', 18);
    }
    function chestArt(c, x, y, open, glowCol) {
      shadowAt(c, x, y + 12, 18, 5);
      block(c, x - 15, y - 6, 30, 18, PAL.wood);
      R(c, x - 15, y + 1, 30, 2, '#2a1c10');
      if (open) block(c, x - 15, y - 16, 30, 7, PAL.wood);
      else block(c, x - 16, y - 12, 32, 8, PAL.wood);
      R(c, x - 3, y - 3, 6, 6, '#e8c050');
      if (!open && glowCol) glow(c, x, y, 30, glowCol, 0.3);
    }
    function crystalArt(c, x, y, col, s = 1, dim = false) {
      shadowAt(c, x, y + 12 * s, 12 * s, 4 * s);
      if (!dim) glow(c, x, y - 10 * s, 46 * s, col, 0.35 + 0.12 * Math.sin(time * 0.08 + x));
      c.fillStyle = OUT;
      c.beginPath();
      c.moveTo(x, y - 36 * s);
      c.lineTo(x + 14 * s, y - 10 * s);
      c.lineTo(x, y + 14 * s);
      c.lineTo(x - 14 * s, y - 10 * s);
      c.closePath();
      c.fill();
      c.fillStyle = dim ? '#4a4058' : col;
      c.beginPath();
      c.moveTo(x, y - 33 * s);
      c.lineTo(x + 11 * s, y - 10 * s);
      c.lineTo(x, y + 11 * s);
      c.lineTo(x - 11 * s, y - 10 * s);
      c.closePath();
      c.fill();
      if (!dim) R(c, x - 4 * s, y - 20 * s, 3 * s, 10 * s, '#ffffff');
      if (!dim) canaanLight(x, y - 10 * s, 90 * s, col);
    }
    function flagArt(c, x, y, col) {
      shadowAt(c, x, y + 10, 8, 3);
      block(c, x - 3, y - 44, 6, 54, PAL.wood);
      c.fillStyle = OUT;
      c.beginPath();
      c.moveTo(x + 2, y - 46);
      c.lineTo(x + 28, y - 36);
      c.lineTo(x + 2, y - 26);
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x + 3, y - 44);
      c.lineTo(x + 24, y - 36);
      c.lineTo(x + 3, y - 28);
      c.fill();
    }
    function personArt(c, x, y, look, tool = 'none') {
      const spr = canaanHeroSprite(sanitizeLook(look), 0, 0, { tool });
      shadowAt(c, x, y + 17, 15, 5);
      c.drawImage(spr, Math.round(x - 26), Math.round(y - 42), 52, 64);
    }
    // Petit dragon (quête 29) : corps rouge, ailes, ventre doré.
    function dragonArt(c, x, y, flap = 0) {
      shadowAt(c, x, y + 26, 16, 4);
      const w = Math.round(Math.sin(flap) * 6);
      block(c, x - 12, y - 6, 24, 14, ['#c83a2a', '#f06a4a', '#8a2418']);
      R(c, x - 8, y + 2, 16, 4, '#f0c060');
      block(c, x + 8, y - 16, 12, 12, ['#c83a2a', '#f06a4a', '#8a2418']);
      R(c, x + 15, y - 12, 2, 2, '#1a1418');
      R(c, x + 10, y - 20, 3, 5, '#f0c060');
      c.fillStyle = '#a82a1a';
      c.beginPath();
      c.moveTo(x - 4, y - 6);
      c.lineTo(x - 22, y - 22 - w);
      c.lineTo(x - 8, y - 4);
      c.fill();
      c.beginPath();
      c.moveTo(x + 2, y - 6);
      c.lineTo(x - 10, y - 26 - w);
      c.lineTo(x + 4, y - 4);
      c.fill();
      R(c, x - 20, y, 9, 4, '#c83a2a');
    }
    function drawObj(c, site, o) {
      if (o.kind === 'field') return LIVE.FIELD.draw(c, site, o);
      const x = o.x,
        y = o.y,
        S = LIVE.ST[site.id],
        hero = game.hero,
        q = site.quest,
        st = stateOf(hero);
      switch (o.kind) {
        case 'gseal':
          return drawSeal(c, site, o);
        case 'shell':
          return drawShell(c, o);
        case 'crystal':
          if (st.flags.lumi) {
            for (let k = 0; k < 5; k++)
              block(c, x - 14 + k * 6, y + 4 - (k % 2) * 4, 4, 6, ['#bfe8ff', '#ffffff', '#7ab0d0']);
            return;
          }
          return crystalArt(c, x, y, '#cfefff');
        case 'hilltop':
          return flagArt(c, x, y, LIVE.qworld.flags.sommet ? '#ffd84a' : '#c84a4a');
        case 'shadowtree': {
          const dig = SITES.q4.objs.find(d => d.kind === 'dig');
          c.save();
          c.globalAlpha = 0.28;
          c.strokeStyle = '#0a1418';
          c.lineWidth = 16;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(x, y + 14);
          c.lineTo(x + (dig.x - x) * 1.15, y + 14 + (dig.y - y) * 1.15);
          c.stroke();
          c.restore();
          return;
        }
        case 'dig':
          if (st.done[4] || (st.active[4] && st.active[4].step >= 1)) {
            R(c, x - 16, y - 2, 32, 12, '#3a2814');
            chestArt(c, x, y - 4, true);
          } else R(c, x - 3, y - 3, 6, 6, '#6a5030');
          return;
        case 'ripple': {
          const gold = S.gold === o.i && now() < S.until;
          for (let k = 0; k < 3; k++) {
            const age = ((time + k * 25 + o.i * 13) % 75) / 75;
            c.globalAlpha = (1 - age) * (gold ? 0.9 : 0.45);
            c.strokeStyle = gold ? '#ffd84a' : '#e8f6ff';
            c.lineWidth = gold ? 3 : 2;
            c.beginPath();
            c.ellipse(x, y, 6 + age * 20, 3 + age * 8, 0, 0, Math.PI * 2);
            c.stroke();
          }
          c.globalAlpha = 1;
          if (gold) glow(c, x, y, 30, '#ffd84a', 0.35);
          return;
        }
        case 'chime':
        case 'mstone': {
          const col = ['#9ad8ff', '#a8f0a0', '#f0e08a', '#f0a8d8'][o.pitch - 1];
          if (o.kind === 'mstone' && !usable(hero, site, o)) return;
          if (o.kind === 'chime' && !(LIVE.qworld.solved.q6 || stepOf(hero, q) >= 1 || st.done[6]))
            return pedestalArt(c, x, y, PAL.moss, null);
          pedestalArt(c, x, y, PAL.moss, null);
          glow(c, x, y - 12, 26, col, 0.45 + 0.2 * Math.sin(time * 0.1 + o.pitch));
          block(c, x - 6, y - 18, 12, 9, [col, '#ffffff', PAL.moss[2]]);
          return;
        }
        case 'door':
          if (LIVE.qworld.flags['sanct_' + o.sanct]) return R(c, x - 22, y + 6, 44, 8, '#4a4a44');
          shadowAt(c, x, y + 20, 26, 6);
          block(c, x - 24, y - 32, 48, 52, PAL.stone);
          block(c, x - 18, y - 26, 36, 46, PAL.dark);
          return rune(c, x, y + 2, '✦', '#c8c0b0', 18);
        case 'shrine': {
          const open = LIVE.qworld.flags['sanct_' + o.sanct],
            s = SANCTUARIES.find(s => s.id === o.sanct),
            lit = st.flags[s.star];
          shadowAt(c, x, y + 14, 26, 6);
          block(c, x - 22, y - 8, 44, 22, PAL.stone);
          block(c, x - 26, y - 13, 52, 7, PAL.stone);
          if (open) {
            crystalArt(c, x, y - 16, lit ? '#ffe9a0' : '#bfe8ff', 0.7, false);
            torchFlame(c, x - 22, y - 16, 0.8);
            torchFlame(c, x + 22, y - 16, 0.8);
          } else crystalArt(c, x, y - 16, '#5a5a54', 0.7, true);
          return;
        }
        case 'sun':
          shadowAt(c, x, y + 14, 16, 5);
          block(c, x - 14, y - 8, 28, 22, PAL.sand);
          glow(c, x, y - 14, 44, '#ffd84a', 0.6);
          block(c, x - 9, y - 22, 18, 14, PAL.gold);
          canaanLight(x, y - 14, 140, '#ffd84a');
          return;
        case 'mirror': {
          const s = S.m[o.i];
          shadowAt(c, x, y + 12, 16, 4);
          block(c, x - 16, y + 4, 32, 8, PAL.iron);
          c.save();
          c.translate(x, y - 8);
          c.rotate([-Math.PI / 4, 0, Math.PI / 4, Math.PI / 2][s]);
          R(c, -22, -5, 44, 10, OUT);
          R(c, -21, -4, 42, 8, '#9ab8d8');
          R(c, -21, -4, 42, 3, '#e8f6ff');
          c.restore();
          return;
        }
        case 'gtree':
          if (LIVE.qworld.flags.goldtree)
            glow(c, x, y - 10, 90, '#ffd84a', 0.35 + 0.1 * Math.sin(time * 0.05));
          return;
        case 'waystone':
          shadowAt(c, x, y + 14, 16, 5);
          block(c, x - 12, y - 32, 24, 46, PAL.dark);
          if (LIVE.qworld.flags.shortcut || st.flags.shortcut) {
            glow(c, x, y - 12, 40, '#9fe8ff', 0.5);
            canaanLight(x, y - 12, 100, '#9fe8ff');
          }
          return rune(c, x, y - 6, '🜁', st.flags.shortcut ? '#dff8ff' : '#20262c');
        case 'sack':
          shadowAt(c, x, y + 12, 14, 4);
          block(c, x - 12, y - 10, 24, 22, ['#b89a6a', '#d8ba8a', '#8a6a3a']);
          return block(c, x - 6, y - 16, 12, 7, ['#9a7a4a', '#b89a6a', '#6a4a2a']);
        case 'easel':
          shadowAt(c, x, y + 14, 14, 4);
          block(c, x - 2, y - 30, 4, 44, PAL.wood);
          block(c, x - 14, y - 28, 28, 22, ['#f0ece4', '#ffffff', '#c8c0b0']);
          return R(c, x - 10, y - 24, 20, 14, st.done[10] ? '#3a4a5a' : '#d8d0c4');
        case 'plank':
          block(c, x - 23, y - 14, 6, 20, PAL.wood);
          block(c, x + 17, y - 14, 6, 20, PAL.wood);
          if (LIVE.qworld.flags.bridge) block(c, x - 24, y - 6, 48, 12, ['#b98a58', '#d1a66c', '#8a5a34']);
          return;
        case 'clue':
          shadowAt(c, x, y + 10, 16, 4);
          if (o.clue === 'lanterne') {
            block(c, x - 6, y - 20, 12, 12, PAL.iron);
            return block(c, x - 10, y - 8, 20, 16, PAL.iron);
          }
          return block(c, x - 22, y - 6, 44, 12, PAL.wood);
        case 'witness': {
          const w = GHOST_CLUES.find(g => g.id === o.clue);
          personArt(
            c,
            x,
            y,
            {
              sex: o.clue === 'vieille' ? 'f' : 'm',
              hair: o.clue === 'vieille' ? '#e8e8e0' : '#5a4030',
              outfit: 'cuir'
            },
            o.clue === 'pecheur' ? 'rod' : 'none'
          );
          if (Math.hypot(P.x - x, P.y - y) < 4 * T) nameTag(c, x, y - 48, w.who);
          return;
        }
        case 'islechest':
          return chestArt(c, x, y, st.done[15] || (st.active[15] && st.active[15].step >= 1), '#ffe9a0');
        // Chapitres IV à VI.
        case 'leaf':
        case 'fresco':
          if (!usable(hero, site, o)) return;
          glow(
            c,
            x,
            y,
            24,
            o.kind === 'leaf' ? '#ffd84a' : '#d8c8a8',
            0.45 + 0.25 * Math.sin(time * 0.12 + x)
          );
          if (o.kind === 'leaf') return rune(c, x, y + 6, '🍂', '#ffffff', 18);
          return block(c, x - 9, y - 7, 18, 14, ['#b8a080', '#d8c8a8', '#8a7050']);
        case 'archive':
          shadowAt(c, x, y + 14, 24, 5);
          block(c, x - 22, y - 34, 44, 48, PAL.wood);
          for (let k = 0; k < 3; k++)
            for (let b = 0; b < 6; b++)
              R(
                c,
                x - 18 + b * 6,
                y - 30 + k * 14,
                5,
                11,
                LIVE.qworld.flags.archives
                  ? ['#a83a2a', '#3a6aa8', '#c8a040', '#4a8a4a'][(b + k) % 4]
                  : '#3a2a1a'
              );
          return;
        case 'vane': {
          shadowAt(c, x, y + 12, 8, 3);
          block(c, x - 2, y - 40, 5, 52, PAL.iron);
          const a = time * 0.02;
          c.save();
          c.translate(x, y - 40);
          c.rotate(a);
          block(c, -16, -2, 32, 4, PAL.iron);
          R(c, 12, -5, 6, 10, '#c84a3a');
          c.restore();
          return;
        }
        case 'goldleaf': {
          if (!at(hero, q, 'catch') && !st.done[18]) return;
          const l = leafAt(site, S.t);
          o.x = l.x;
          o.y = l.y;
          shadowAt(c, l.x, l.y + 4, 10 - l.h * 5, 3);
          glow(c, l.x, l.y - l.h * 50, 22, '#ffd84a', 0.5);
          c.save();
          c.translate(l.x, l.y - l.h * 50);
          c.rotate(Math.sin(time * 0.1) * 0.8);
          rune(c, 0, 6, '🍂', '#ffffff', 18);
          c.restore();
          return;
        }
        case 'waterwheel': {
          shadowAt(c, x, y + 20, 26, 6);
          c.save();
          c.translate(x, y - 6);
          c.rotate(LIVE.qworld.flags.grenier ? time * 0.04 : time * -0.01);
          for (let k = 0; k < 8; k++) {
            c.rotate(Math.PI / 4);
            block(c, -3, -26, 6, 22, PAL.wood);
          }
          c.restore();
          return block(c, x - 6, y - 12, 12, 12, PAL.iron);
        }
        case 'mill':
          shadowAt(c, x, y + 40, 30, 7);
          block(c, x - 26, y - 20, 52, 58, PAL.stone);
          block(c, x - 30, y - 34, 60, 16, ['#a8603a', '#c8804a', '#6a3a1a']);
          c.save();
          c.translate(x, y - 32);
          c.rotate(LIVE.qworld.flags.grenier ? time * 0.05 : time * -0.02);
          for (let k = 0; k < 4; k++) {
            c.rotate(Math.PI / 2);
            block(c, -4, -46, 8, 40, ['#e8e0d0', '#ffffff', '#b8b0a0']);
          }
          c.restore();
          return;
        case 'traveler':
          personArt(
            c,
            x,
            y,
            {
              sex: o.who === 'Mila' ? 'f' : 'm',
              race: o.who === 'Barnabé' ? 'orc' : 'humain',
              hair: '#5a3a20',
              outfit: o.who === 'Gaspard' ? 'rose' : 'foret'
            },
            o.who === 'Barnabé' ? 'spear' : 'none'
          );
          if (Math.hypot(P.x - x, P.y - y) < 4 * T) nameTag(c, x, y - 48, o.who);
          return;
        case 'hide':
          if (o.look === 'pumpkin') {
            shadowAt(c, x, y + 12, 18, 5);
            block(c, x - 16, y - 8, 32, 20, ['#e07a2a', '#f8a04a', '#a84a10']);
            return block(c, x - 3, y - 16, 6, 8, PAL.moss);
          }
          if (o.look === 'leaves') {
            shadowAt(c, x, y + 8, 18, 4);
            for (let k = 0; k < 6; k++)
              block(c, x - 16 + (k % 3) * 10, y - 4 - Math.floor(k / 3) * 6, 10, 6, [
                '#c86a2a',
                '#e89a4a',
                '#8a3a10'
              ]);
            return;
          }
          return block(c, x - 22, y - 6, 44, 10, PAL.wood);
        case 'starplate':
          R(c, x - 22, y - 14, 44, 28, '#a8885a');
          block(c, x - 18, y - 11, 36, 22, PAL.sand);
          if (LIVE.qworld.flags.cite) glow(c, x, y, 50, '#fff0a0', 0.5);
          return rune(c, x, y + 6, '✦', LIVE.qworld.flags.cite ? '#ffffff' : '#6a4a1a', 18);
        case 'machine': {
          shadowAt(c, x, y + 50, 70, 14);
          for (let k = 0; k < 3; k++) {
            const r = 22 + k * 20,
              rot = LIVE.qworld.flags.machine ? time * 0.012 * (k % 2 ? -1 : 1) : k * 0.9;
            c.strokeStyle = OUT;
            c.lineWidth = 12;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.stroke();
            c.strokeStyle = ['#c89a30', '#9a88c8', '#6aa8c8'][k];
            c.lineWidth = 8;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.stroke();
            for (let s = 0; s < 6; s++) {
              const a = rot + (s * Math.PI) / 3 - Math.PI / 2;
              R(c, x + Math.cos(a) * r - 2, y + Math.sin(a) * r - 2, 4, 4, s === 0 ? '#ffffff' : '#2a2014');
            }
          }
          R(c, x - 2, y - 88, 4, 14, '#ffffff');
          if (LIVE.qworld.flags.machine) glow(c, x, y, 90, '#fff0a0', 0.4);
          return;
        }
        case 'treasure':
          return chestArt(c, x, y, LIVE.qworld.flags.machine, '#ffd84a');
        case 'templedoor':
          shadowAt(c, x, y + 18, 26, 6);
          if (LIVE.qworld.solved.q24) {
            block(c, x - 24, y - 34, 48, 6, PAL.sand);
            return chestArt(c, x, y - 4, false, '#ffd84a');
          }
          block(c, x - 22, y - 34, 44, 52, PAL.sand);
          return rune(c, x, y - 4, '☀', '#8a6418', 22);
        case 'oasis':
          return block(
            c,
            x - 22,
            y - 22,
            92,
            92,
            LIVE.qworld.flags.oasis ? ['#3a8ac8', '#7ac0f0', '#1a5a8a'] : PAL.sand
          );
        case 'altar': {
          shadowAt(c, x, y + 14, 26, 6);
          block(c, x - 24, y - 8, 48, 22, PAL.lilac);
          const stars = st.done[26] || stepOf(hero, q) >= 4 ? 6 : starCount(st);
          for (let k = 0; k < 6; k++) {
            const lit = (st.done[26] || stepOf(hero, q) >= 4) && k < stars;
            rune(c, x - 20 + k * 8, y + 4, lit ? '★' : '☆', lit ? '#fff0a0' : '#3a2a58', 10);
          }
          if (st.done[26]) glow(c, x, y - 10, 60, '#fff0a0', 0.4);
          return;
        }
        case 'fresco27':
          shadowAt(c, x, y + 14, 22, 5);
          block(c, x - 22, y - 34, 44, 48, PAL.lilac);
          return rune(c, x, y - 4, '🛡️', '#ffffff', 22);
        case 'altar27': {
          shadowAt(c, x, y + 16, 28, 7);
          block(c, x - 26, y - 6, 52, 22, PAL.gold);
          const awake = LIVE.qworld.solved.q27 || st.done[27];
          return crystalArt(c, x, y - 10, awake ? '#fff0a0' : '#c8b8f0', 1.1, false);
        }
        case 'ccrystal': {
          const hp = LIVE.ST.q27.on ? LIVE.ST.q27.hp[o.i] : 100,
            col = ['#ff8a8a', '#ffd08a', '#fff08a', '#8affa8', '#8ad8ff', '#c88aff'][o.i];
          crystalArt(c, x, y, col, 0.8, hp <= 0);
          if (LIVE.ST.q27.on && hp > 0) {
            R(c, x - 16, y + 18, 32, 4, OUT);
            R(c, x - 15, y + 19, (30 * hp) / 100, 2, '#8affa8');
          }
          return;
        }
        case 'lever': {
          const down = LIVE.ST.q28.l[o.i];
          shadowAt(c, x, y + 12, 10, 3);
          block(c, x - 10, y, 20, 12, PAL.lilac);
          c.save();
          c.translate(x, y + 2);
          c.rotate(down ? 0.7 : -0.7);
          block(c, -2, -24, 4, 24, PAL.iron);
          block(c, -5, -28, 10, 7, ['#c8b8f0', '#ffffff', '#8a7ab8']);
          c.restore();
          return;
        }
        case 'mrock':
          if (!puzzleMirrorRocks(LIVE.ST.q28.l).has(o.dx + ',' + o.dy))
            return R(c, x - 14, y + 6, 28, 6, '#3a3048');
          shadowAt(c, x, y + 14, 18, 5);
          return block(c, x - 18, y - 16, 36, 30, PAL.lilac);
        case 'echest':
          return chestArt(c, x, y, st.done[28], '#c8b8f0');
        case 'lake': {
          const S2 = LIVE.ST.q30;
          for (const [dx, dy] of site.stones) {
            const sx = px(site, dx),
              sy = py(site, dy),
              k = CONSTELLATION.findIndex(([a, b]) => a === dx && b === dy);
            block(c, sx - 18, sy - 12, 36, 26, ['#7a8aa0', '#a8b8d0', '#4a5a70']);
            if (k >= 0 && (k < S2.seq || LIVE.qworld.solved.q30)) glow(c, sx, sy, 30, '#dff4ff', 0.6);
          }
          // Reflet de la constellation : les étoiles s'allument l'une après l'autre.
          const lit = Math.floor(time / 50) % (CONSTELLATION.length + 2);
          CONSTELLATION.forEach(([dx, dy], k) => {
            const sx = px(site, dx),
              sy = py(site, dy) - 4;
            rune(c, sx, sy + 5, '✦', k < lit || LIVE.qworld.solved.q30 ? '#ffffff' : '#5a6a8a', 14);
            if (k && (k < lit || LIVE.qworld.solved.q30)) {
              c.globalAlpha = 0.5;
              c.strokeStyle = '#dff4ff';
              c.lineWidth = 1;
              c.beginPath();
              c.moveTo(px(site, CONSTELLATION[k - 1][0]), py(site, CONSTELLATION[k - 1][1]) - 4);
              c.lineTo(sx, sy);
              c.stroke();
              c.globalAlpha = 1;
            }
          });
          return;
        }
      }
    }
    // Ce que le héros voit d'un lieu des chapitres IV à VI en plus des objets : objet porté, rayons, dragon.
    function drawMoreExtras(c, site) {
      if (site.id === 'q24') {
        const b = beamOf(site);
        c.save();
        c.strokeStyle = '#ffe890';
        c.globalAlpha = 0.75;
        c.lineWidth = 5;
        c.shadowColor = '#ffd84a';
        c.shadowBlur = 14;
        c.beginPath();
        b.pts.forEach(([dx, dy], i) =>
          i ? c.lineTo(px(site, dx), py(site, dy) - 8) : c.moveTo(px(site, dx), py(site, dy) - 8)
        );
        c.stroke();
        c.restore();
      }
      if (site.id === 'q29') {
        // Braise : posé près de Pyria, puis en vol au-dessus de la clairière.
        let x = px(site, -5),
          y = py(site, -1),
          flap = time * 0.1;
        if (LIVE.qworld.flags.pyria) {
          x = px(site, 0) + Math.cos(time * 0.02) * 4 * T;
          y = py(site, -2) + Math.sin(time * 0.04) * 1.5 * T - 30;
          flap = time * 0.4;
        }
        dragonArt(c, x, y, flap);
      }
    }
    const nameTag = (c, x, y, text) => drawCanaanName(c, text, x, y);
    // Décors propres à chaque lieu : traces, ombres, rayon, lucioles, panneaux, nénuphars, pont, mouton.
    function drawSiteExtras(c, site) {
      const hero = game.hero,
        st = stateOf(hero);
      if (site.id === 'q1' && at(hero, site.quest, 'trail')) {
        const a = NPCS.liora,
          b = [px(site, 0), py(site, 0)];
        for (let k = 1; k < 26; k++) {
          const t = k / 26,
            x = a.x + (b[0] - a.x) * t + Math.sin(t * 12) * 18,
            y = a.y + (b[1] - a.y) * t + Math.cos(t * 9) * 12;
          glow(c, x, y, 14, '#bfe8ff', 0.35 + 0.25 * Math.sin(time * 0.1 - k * 0.6));
        }
      }
      if (site.id === 'q3' && LIVE.qworld.flags.sommet) {
        const sprite = CANAAN_LIFE.icon('mouton'),
          x = px(site, 3),
          y = py(site, -4);
        if (sprite) c.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height + 8));
      }
      if (site.id === 'q8') {
        for (const [dx, dy] of site.fireflies) {
          const x = px(site, dx) + Math.sin(time * 0.05 + dx) * 6,
            y = py(site, dy) + Math.cos(time * 0.07 + dy) * 6;
          glow(c, x, y, 16, '#e8ff8a', 0.45 + 0.3 * Math.sin(time * 0.12 + dx * 2 + dy));
        }
        for (const s of site.signs) {
          const x = px(site, s.dx),
            y = py(site, s.dy);
          R(c, x - 2, y - 24, 4, 26, '#6a4a2a');
          R(c, x - 14 + s.dir[0] * 6, y - 30, 28, 10, '#a8804a');
          c.font = canaanFont(9);
          c.textAlign = 'center';
          c.fillStyle = '#2a1a0a';
          c.fillText(
            s.dir[0] > 0 ? 'Sortie →' : s.dir[0] < 0 ? '← Sortie' : s.dir[1] < 0 ? '↑ Sortie' : '↓ Sortie',
            x + s.dir[0] * 6,
            y - 22
          );
        }
      }
      if (site.id === 'q9' && at(hero, site.quest, 'trail')) {
        site.trail.forEach(([x, y], k) => {
          if (Math.hypot(P.x - x, P.y - y) > 3.5 * T) return;
          R(c, x - 3 + (k % 2) * 6, y - 2, 4, 4, '#5a4a3a');
          R(c, x - 4 + (k % 2) * 6, y - 5, 2, 2, '#5a4a3a');
        });
      }
      if (site.id === 'q10') {
        const v = site.objs.find(o => o.kind === 'viewpoint'),
          d = Math.hypot(P.x - v.x, P.y - v.y),
          x = px(site, 0),
          y = py(site, 0) - 34;
        c.save();
        c.globalAlpha = 0.32;
        c.fillStyle = '#0a1418';
        if (d < 0.9 * T && (at(hero, site.quest, 'spot') || st.done[10])) {
          // L'oiseau d'ombre.
          c.beginPath();
          c.moveTo(x - 60, y - 10);
          c.quadraticCurveTo(x - 20, y - 40, x, y - 4);
          c.quadraticCurveTo(x + 20, y - 40, x + 60, y - 10);
          c.quadraticCurveTo(x + 20, y - 14, x + 6, y + 18);
          c.lineTo(x - 6, y + 18);
          c.quadraticCurveTo(x - 20, y - 14, x - 60, y - 10);
          c.fill();
        } else {
          c.beginPath();
          c.ellipse(x - (P.x - v.x) * 0.15, y, 40 + Math.min(30, d / 8), 18, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
      if (site.id === 'q11' && LIVE.qworld.flags.lanterns) {
        for (let k = 0; k < 6; k++) glow(c, px(site, 0), py(site, -3 + k * 0.2) - k * 4, 18, '#ffc860', 0.25);
      }
      drawMoreExtras(c, site);
      if (site.id === 'q15') {
        site.pads.forEach(([dx, dy], i) => {
          const pad = LIVE.ST.q15.pads[i],
            x = px(site, dx),
            y = py(site, dy);
          if (pad.sunk) return;
          const s = 1 - Math.min(0.5, pad.t / 4);
          c.fillStyle = pad.t > 1.2 ? '#4a7a3a' : '#5aa04a';
          c.beginPath();
          c.ellipse(x, y, 20 * s, 14 * s, 0, 0.3, Math.PI * 2);
          c.lineTo(x, y);
          c.fill();
        });
      }
    }
    // Monde : lieux visibles, objets, PNJ et marques (! disponible, ? à rendre).
    function drawWorld(c) {
      if (game.world.instance) return;
      c.save();
      c.imageSmoothingEnabled = false;
      for (const site of Object.values(SITES)) {
        if (!here(site)) continue;
        if (!site.under && visible(px(site, 0), py(site, 0), (site.r + 7) * T)) drawSiteExtras(c, site);
        for (const o of site.objs) if (visible(o.x, o.y)) drawObj(c, site, o);
      }
      if (WAYSTONE.camp && !canaanUnder() && visible(WAYSTONE.camp.x, WAYSTONE.camp.y))
        drawObj(c, SITES.q8, { kind: 'waystone', x: WAYSTONE.camp.x, y: WAYSTONE.camp.y });
      for (const npc of Object.values(NPCS)) {
        if (!here(npc) || !visible(npc.x, npc.y) || !present(game.hero, npc)) continue;
        const def = npc.def,
          // Un nain du jeu se promène autour de sa place (dessiné par underground.js).
          at0 = npc.dwarf || npc,
          dx = P.x - at0.x,
          dy = P.y - at0.y;
        if (Math.hypot(dx, dy) < 3 * T)
          npc.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
        const s = def.child ? 0.8 : 1;
        if (npc.dwarf) {
          // Déjà dessiné.
        } else if (def.mob) LIVE.FIELD.mobArt(c, npc.id, def.mob, npc.x, npc.y, 1, def.pal);
        else if (def.dwarf) {
          c.globalAlpha = def.ghost ? 0.6 + 0.15 * Math.sin(time * 0.06) : 1;
          if (def.ghost) glow(c, npc.x, npc.y - 16, 40, '#bfe8ff', 0.35);
          CANAAN_UNDER.dwarfArt(c, { name: def.name, ...def.dwarf }, npc.x, npc.y, dx < 0 ? -1 : 1);
          c.globalAlpha = 1;
        } else if (def.spirit) {
          // Lumi elle-même : une petite lumière qui flotte.
          const yy = npc.y - 20 + Math.sin(time * 0.07) * 6;
          glow(c, npc.x, yy, 44, '#bfe8ff', 0.6);
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(npc.x, yy, 7, 0, Math.PI * 2);
          c.fill();
          canaanLight(npc.x, yy, 110, '#bfe8ff');
        } else {
          c.globalAlpha = def.ghost ? 0.55 + 0.15 * Math.sin(time * 0.06) : 1;
          if (def.ghost) glow(c, npc.x, npc.y - 20, 40, '#bfe8ff', 0.35);
          c.drawImage(
            canaanHeroSprite(sanitizeLook(def.look), npc.face, 0, { tool: def.tool || 'none' }),
            Math.round(npc.x - 26 * s),
            Math.round(npc.y + 18 - 60 * s + (def.ghost ? Math.sin(time * 0.05) * 3 : 0)),
            Math.round(52 * s),
            Math.round(64 * s)
          );
          c.globalAlpha = 1;
        }
        const mode = npcState(game.hero, npc.quest),
          // Grand troc : l'habitant qui attend l'objet tenu montre un cadeau (de près) ; Madame Nacre, un palier atteint.
          gift =
            (Math.hypot(dx, dy) < 6 * T && tradeAt(game.hero, npc.id)) ||
            (def.collector && shellRewardsDue(stateOf(game.hero)).length),
          // Une étape en cours l'attend (parler, choisir) : « ? », comme une quête à rendre.
          mark = def.guild
            ? guildMark(game.hero)
            : errand(game.hero, npc)
              ? '?'
              : mode === 'offer'
                ? '!'
                : mode === 'ready'
                  ? '?'
                  : mode === 'active'
                    ? '…'
                    : '';
        if (gift && !mark) rune(c, at0.x, at0.y - 58 * s + Math.sin(time * 0.08) * 3, '🎁', '#ffffff', 22);
        if (mark) {
          // Au-dessus du nom et de l'invitation des nains.
          const yy = at0.y - (npc.dwarf ? 78 : 58 * s) + Math.sin(time * 0.08) * 3;
          canaanText(
            c,
            mark,
            at0.x,
            yy,
            26,
            mark === '…' ? '#c8c0b0' : npc.quest?.main ? '#ffd84a' : '#fff0a0',
            {
              line: 4
            }
          );
        }
        if (!npc.dwarf && Math.hypot(dx, dy) < 4 * T) nameTag(c, npc.x, npc.y - 46 * s, def.name);
      }
      if (!guest()) drawZones(c);
      drawRaised(c);
      LIVE.FIELD.drawHero(c);
      // Lumi éclaire la nuit autour de chaque héros qu'elle accompagne.
      for (const hero of game.heroes) {
        const l = lumiAt.get(hero);
        if (l && !hero.player.dead) canaanLight(l.x, l.y, 90, '#bfe8ff');
      }
      const n = nearest();
      if (n && !modalOpen() && !n.npc?.dwarf) {
        const x = n.npc ? n.npc.x : n.o.x,
          y = n.npc ? n.npc.y : n.o.y;
        prompt(c, x, y - (n.npc ? 74 : 44), label(game.hero, n));
      }
      c.restore();
    }
    // Maîtresse de guilde : « ? » quand un avis de la guilde est à rendre, « ! » quand aucun contrat n'est en cours.
    function guildMark(hero) {
      const c = activeContract(stateOf(hero));
      return !c ? '!' : c.npc === 'guilde' && questReady(stateOf(hero), c) ? '?' : '';
    }
    // Bulles : un PNJ qui a une quête à proposer appelle le héros qui passe.
    function drawBubbles(c) {
      if (game.world.instance) return;
      for (const npc of Object.values(NPCS)) {
        if (!here(npc)) continue;
        const d = Math.hypot(P.x - npc.x, P.y - npc.y);
        if (!npc.quest || d > 4 * T || d < 1.6 * T || npcState(game.hero, npc.quest) !== 'offer') continue;
        // Traduite avant d'être coupée : un début de phrase seul ne serait pas reconnu.
        const said = translateText(npc.quest.talk.offer[0]),
          text = said.slice(0, 60) + (said.length > 60 ? '…' : '');
        c.save();
        c.font = canaanFont(12, '');
        c.textAlign = 'center';
        const w = Math.min(240, c.measureText(text).width + 20),
          x = npc.x - w / 2,
          y = npc.y - 100;
        c.globalAlpha = 0.95;
        c.fillStyle = '#fbf3df';
        c.strokeStyle = '#3a2a1e';
        c.lineWidth = 2;
        c.beginPath();
        if (c.roundRect) c.roundRect(x, y, w, 24, 7);
        else c.rect(x, y, w, 24);
        c.fill();
        c.stroke();
        c.fillStyle = '#2a1e14';
        c.fillText(text, npc.x, y + 16, w - 12);
        c.restore();
      }
    }
    // Lumi et la bénédiction des racines d'or, au-dessus des héros ; suivi de la quête à l'écran.
    // Lumi flotte et éclaire, sans bulle de message (le suivi de la quête reste dans le cadre à l'écran).
    const lumiAt = new WeakMap();
    window.CanaanStages.drawQuests = function () {
      if (!started) return;
      ctx.save();
      ctx.translate(Math.round(-camX), Math.round(-camY));
      for (const hero of game.heroes) {
        const p = hero.player,
          flags =
            hero === game.hero
              ? stateOf(hero).flags
              : {
                  lumi: hero.questLook & 1,
                  blessing: hero.questLook & 2,
                  aurora: hero.questLook & 4,
                  echo: hero.questLook & 8
                };
        if (p.dead) continue;
        // Aura du Gardien de l'Aurore : anneau de lumière dorée et rose sous les pieds.
        if (flags.aurora) {
          ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 0.08);
          ctx.strokeStyle = time % 120 < 60 ? '#ffe9a0' : '#ffb8e8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 16, 24, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (flags.blessing && time % 14 === 0)
          particles.push({
            x: p.x + (Math.random() - 0.5) * 34,
            y: p.y + 14,
            vx: 0,
            vy: -0.4,
            life: 34,
            c: '#ffd84a',
            r: 2
          });
        // Écho : une lueur d'ambre des profondeurs, qui tourne lentement autour du héros.
        if (flags.echo) {
          const a = time * 0.035,
            ex = p.x + Math.cos(a) * 24,
            ey = p.y - 30 + Math.sin(a * 2) * 5;
          glow(ctx, ex, ey, 22, '#ffc65a', 0.55);
          R(ctx, ex - 3, ey - 3, 6, 6, '#8a5a20');
          R(ctx, ex - 2, ey - 2, 4, 4, '#ffe0a0');
          canaanLight(ex, ey, 70, '#ffc65a');
        }
        if (!flags.lumi) continue;
        const l = lumiAt.get(hero) || { x: p.x, y: p.y };
        // Lumi guide son héros : elle vole du côté de l'objectif suivi (encadré du suivi), sinon derrière lui.
        const goal =
            hero === game.hero &&
            LIVE.guideTo &&
            Math.hypot(LIVE.guideTo.x - p.x, LIVE.guideTo.y - p.y) > 3 * T,
          ga = goal ? Math.atan2(LIVE.guideTo.y - p.y, LIVE.guideTo.x - p.x) : 0;
        const tx = goal ? p.x + Math.cos(ga) * 46 : p.x - 26 * (p.face || 1),
          ty = (goal ? p.y - 30 + Math.sin(ga) * 30 : p.y - 52) + Math.sin(time * 0.07) * 6;
        l.x += (tx - l.x) * 0.06;
        l.y += (ty - l.y) * 0.06;
        lumiAt.set(hero, l);
        // Lumi parle (conseil de guide.js) : un anneau de lumière qui pulse autour d'elle.
        if (hero === game.hero && CANAAN_GUIDE.speaking()) {
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.15);
          ctx.strokeStyle = '#dff4ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(l.x, l.y, 12 + Math.sin(time * 0.15) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        glow(ctx, l.x, l.y, 30, '#bfe8ff', 0.55);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
        ctx.fill();
        R(ctx, l.x - 9 + Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
        R(ctx, l.x + 5 - Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
      }
      ctx.restore();
      watchFanfare();
      if (time % 15 === 0) tracker();
    };

    return Object.freeze({
      // Outils de dessin des objectifs de terrain (quest-field.js).
      art: Object.freeze({
        R,
        glow,
        block,
        rune,
        shadowAt,
        crystalArt,
        flagArt,
        torchFlame,
        personArt,
        chestArt,
        PAL,
        OUT
      }),
      drawWorld,
      drawBubbles
    });
  }
  window.CANAAN_QUEST_RENDER = Object.freeze({ create });
})();
