// Dessin des donjons, des raids et de l'Arène : sol peint, objets de l'exploration (portes, leviers, braseros,
// stèles…), portail de sortie, gradins de l'Arène, entrées sur l'île et ambiance ; les textures et cases en pixel art
// sont dans client/art/dungeon-tiles.js, le décor dans client/art/dungeon-decor.js. Aucune
// règle ici : les plans, les énigmes et les boss sont dans scripts/dungeons/dungeons.js ; la structure, les créatures
// et la palette de chaque instance (sols, murs, lumière, flammes, runes, bannières…) dans sa fiche de
// shared/data/dungeons/.
// dungeons.js appelle CANAAN_DUNGEON_RENDER.create(scène) une fois : la scène lui donne les cases, les plans,
// l'état de l'exploration et les sorties (lus au moment du dessin, jamais modifiés ici).
(() => {
  'use strict';
  function create(scene) {
    const {
      WALL,
      GATE,
      FLOOR,
      ACCENT,
      HAZARD,
      SECRET,
      WALKABLE,
      SIGILS,
      exitSpot,
      exitNear,
      planFor,
      dunState,
      reachable,
      beamPath,
      trapPhase,
      trapZones,
      secretOpen,
      hostTime
    } = scene;

    // Thème complet d'une instance : plan, créatures et apparence de sa fiche (shared/data/dungeons/).
    const theme = (layout, actors, palette) => ({
      ...layout,
      ...actors,
      ...palette,
      hazard: { ...layout.hazard, ...palette.hazard },
      accent: { ...layout.accent, ...palette.accent }
    });
    /** @type {any[] & { arena?: any }} */
    const THEMES = DUNGEON_LAYOUTS.map((layout, i) => theme(layout, DUNGEON_ACTORS[i], DUNGEON_PALETTES[i]));
    THEMES.arena = theme(DUNGEON_ARENA_LAYOUT, { mobs: [], bosses: [] }, DUNGEON_ARENA_PALETTE);
    // Gradins du colisée en gros pixels, comme le décor de l'île : chaque case est peinte une fois en petit (16 × 16),
    // puis agrandie ×3 sans lissage. Marches de grès ombrées et jointoyées, public de petits personnages cernés
    // d'encre (tenue, teint, cheveux, chapeau, capuche ou casque) ; quand la foule acclame, ils sautent bras levés.
    // En haut des gradins, une promenade dallée et sa balustrade.
    const CROWD = ['#7a1424', '#2a4a7a', '#c8a050', '#3a6a3a', '#6a3a7a', '#a85a2a', '#d8d0c0', '#4a4a52'];
    const SKIN = ['#f0c8a0', '#d8a47a', '#a8744e', '#6e4a32'],
      HAIR = ['#2a1c14', '#5a3a20', '#a8742e', '#e0c070', '#8a8a90', '#7a2a1a'],
      HATS = ['#c8a050', '#7a1424', '#3a5a2a', '#e8dcc0'];
    const STAND = { art: 16, seat: 13 },
      standCache = { fans: new Map(), seats: new Map(), tiles: new Map() };
    const ink = cv => (typeof window.canaanOutline === 'function' ? window.canaanOutline(cv, 1) : cv);
    // Spectateur (7 × 10 pixels avant le contour) : tête, buste ombré à droite, bras le long du corps ou levés.
    function fanLook(x, y, k) {
      const h = hash(x, y, k),
        h2 = hash(y, x, k + 7);
      return {
        shirt: CROWD[Math.floor(h * 97) % CROWD.length],
        skin: SKIN[Math.floor(h * 53) % SKIN.length],
        hair: HAIR[Math.floor(h2 * 61) % HAIR.length],
        hat: HATS[Math.floor(h2 * 29) % HATS.length],
        top: h2 < 0.12 ? 'hat' : h2 < 0.2 ? 'hood' : h2 < 0.24 ? 'helm' : h2 > 0.72 ? 'long' : 'hair'
      };
    }
    function fanSprite(look, up) {
      const key = look.shirt + look.skin + look.hair + look.hat + look.top + (up ? 1 : 0);
      let img = standCache.fans.get(key);
      if (img) return img;
      const cv = canvas(7, 10),
        g = cv.getContext('2d'),
        P1 = (x, y, col, w = 1, h = 1) => rect(g, x, y, w, h, col),
        shirtL = mixHex(look.shirt, '#ffffff', 0.2),
        shirtD = mixHex(look.shirt, '#000000', 0.3),
        skinD = mixHex(look.skin, '#000000', 0.18);
      // Buste et épaules, éclairés par la gauche ; col plus clair, bas dans l'ombre du banc.
      P1(1, 4, look.shirt, 5, 5);
      P1(1, 4, shirtL, 1, 4);
      P1(5, 4, shirtD, 1, 5);
      P1(3, 4, shirtL);
      P1(1, 8, shirtD, 5, 1);
      // Tête : visage, yeux, menton ombré.
      P1(2, 1, look.skin, 3, 3);
      P1(2, 3, skinD, 3, 1);
      P1(2, 2, '#2a1c14');
      P1(4, 2, '#2a1c14');
      if (look.top === 'hat') {
        P1(1, 1, mixHex(look.hat, '#000000', 0.2), 5, 1);
        P1(2, 0, look.hat, 3, 1);
      } else if (look.top === 'hood') {
        P1(2, 0, shirtD, 3, 1);
        P1(1, 1, shirtD, 1, 3);
        P1(5, 1, shirtD, 1, 3);
      } else if (look.top === 'helm') {
        P1(1, 0, '#8a8a94', 5, 2);
        P1(2, 0, '#c8c8d0', 2, 1);
        P1(3, 2, '#5a5a62');
      } else {
        P1(2, 0, look.hair, 3, 1);
        P1(2, 1, look.hair, 1, 1);
        if (look.top === 'long') {
          P1(1, 1, look.hair, 1, 4);
          P1(5, 1, look.hair, 1, 4);
        }
      }
      if (up) {
        // Bras levés : manches de chaque côté, mains au-dessus de la tête.
        P1(0, 2, shirtL, 1, 3);
        P1(6, 2, shirtD, 1, 3);
        P1(0, 1, look.skin);
        P1(6, 1, look.skin);
      } else {
        P1(1, 7, look.skin);
        P1(5, 7, skinD);
      }
      img = ink(cv);
      standCache.fans.set(key, img);
      return img;
    }
    // Grain de la pierre à l'échelle de l'art : n pixels clairs ou sombres entre les lignes y0 et y0 + h.
    function grain(g, y0, h, n, cols, seed) {
      for (let k = 0; k < n; k++)
        rect(
          g,
          Math.floor(hash(k, seed, 3) * 16),
          y0 + Math.floor(hash(seed, k, 5) * h),
          k % 3 ? 1 : 2,
          1,
          cols[k % 2]
        );
    }
    // Marche (16 × 16) : contremarche jointoyée en haut, ombre, assise claire, nez de marche et son ombre ;
    // promenade (rangée du haut) : dalles et balustrade.
    function seatTile(th, band, v) {
      const key = band + ':' + v;
      let cv = standCache.seats.get(key);
      if (cv) return cv;
      cv = canvas(STAND.art, STAND.art);
      const g = cv.getContext('2d'),
        w = th.wall,
        P1 = (x, y, col, ww = 1, hh = 1) => rect(g, x, y, ww, hh, col),
        tone = band % 2 ? 0.12 : 0;
      if (band >= 6) {
        const slab = mixHex(mixHex(w.face, w.light, 0.55), '#000000', tone);
        P1(0, 0, slab, 16, 16);
        for (let y = 0; y < 11; y += 5) P1(0, y, mixHex(slab, w.dark, 0.35), 16, 1);
        for (let y = 0; y < 11; y += 5) P1(((v * 5 + y) % 8) + 3, y, mixHex(slab, w.dark, 0.35), 1, 5);
        grain(g, 0, 10, 6, [mixHex(slab, '#ffffff', 0.2), mixHex(slab, w.dark, 0.25)], 31 + v);
        // Balustrade : main courante et balustres.
        P1(0, 10, th.pillar[2], 16, 1);
        P1(0, 11, th.pillar[0], 16, 1);
        for (let x = 1; x < 16; x += 4) {
          P1(x, 12, th.pillar[0], 2, 3);
          P1(x, 12, th.pillar[2], 1, 3);
        }
        P1(0, 15, w.dark, 16, 1);
      } else {
        const riser = mixHex(mixHex(w.face, w.dark, 0.3), '#000000', tone),
          joint = mixHex(riser, w.dark, 0.55),
          seat = mixHex(mixHex(w.face, w.light, 0.45), '#000000', tone);
        P1(0, 0, riser, 16, 7);
        P1(0, 3, joint, 16, 1);
        for (let x = v % 8; x < 16; x += 8) {
          P1(x, 0, joint, 1, 3);
          P1((x + 4) % 16, 4, joint, 1, 3);
        }
        P1(0, 7, w.dark, 16, 1);
        P1(0, 8, seat, 16, 5);
        grain(g, 8, 5, 7, [mixHex(seat, '#ffffff', 0.22), mixHex(seat, w.dark, 0.3)], 17 + v * 3);
        P1(0, 13, th.pillar[2], 16, 1);
        P1(0, 14, mixHex(w.face, w.dark, 0.25), 16, 1);
        P1(0, 15, w.dark, 16, 1);
      }
      standCache.seats.set(key, cv);
      return cv;
    }
    // Spectateurs d'une case : deux places (le sprite contouré fait 9 pixels de large), quelques-unes vides.
    function fansAt(x, y) {
      const out = [];
      for (let k = 0; k < 2; k++) {
        const hsh = hash(x, y, k);
        if (hsh < 0.14) continue;
        out.push({ k, dx: k ? 7 : hsh > 0.6 ? 1 : 0, look: fanLook(x, y, k), hsh });
      }
      return out;
    }
    // Case au repos (marche et public assis), peinte une fois.
    function standTile(th, x, y, band) {
      const key = y * MAPW + x;
      let cv = standCache.tiles.get(key);
      if (cv) return cv;
      cv = canvas(STAND.art, STAND.art);
      const g = cv.getContext('2d');
      g.drawImage(seatTile(th, band, (x * 7 + y * 3) % 8), 0, 0);
      if (band < 6)
        for (const f of fansAt(x, y)) {
          const img = fanSprite(f.look, false);
          g.drawImage(img, f.dx, STAND.seat - img.height + 1);
        }
      standCache.tiles.set(key, cv);
      return cv;
    }
    // Rang de gradin d'une case (0 en bas, 6 pour la promenade), ou -1 hors des tribunes.
    function standBand(grid, x, y) {
      const { cx, cy, r } = DUNGEON_ARENA,
        d = Math.hypot(x - cx, y - cy);
      if (d < r + 0.6 || d > r + 7 || grid[y]?.[x] !== WALL || grid[y + 1]?.[x] !== WALL) return -1;
      return Math.min(6, Math.floor(d - r));
    }
    // Tribunes peintes à l'avance (panneau de l'Arène ouvert) : marches, public assis, et chaque spectateur debout
    // bras levés pour les acclamations. Un générateur : une case par étape.
    function* warmStands() {
      const { cx, cy } = DUNGEON_ARENA,
        th = THEMES.arena,
        grid = planFor('arena').grid;
      for (let y = cy - 20; y <= cy + 15; y++)
        for (let x = cx - 20; x <= cx + 20; x++) {
          const band = standBand(grid, x, y);
          if (band < 0) continue;
          standTile(th, x, y, band);
          if (band < 6) for (const f of fansAt(x, y)) fanSprite(f.look, true);
          yield;
        }
    }
    function drawArenaStands(c) {
      const { cx, cy } = DUNGEON_ARENA,
        th = THEMES.arena,
        cheer = CANAAN_ARENA.cheer();
      c.save();
      c.imageSmoothingEnabled = false;
      for (let y = cy - 20; y <= cy + 15; y++)
        for (let x = cx - 20; x <= cx + 20; x++) {
          const band = standBand(game.world.tiles, x, y);
          if (band < 0) continue;
          const X = x * TS,
            Y = y * TS;
          if (X < camX - TS || X > camX + W || Y < camY - TS || Y > camY + H) continue;
          if (cheer <= 0 || band >= 6) {
            c.drawImage(standTile(th, x, y, band), X, Y, TS, TS);
            continue;
          }
          // Acclamations : la marche seule, puis chaque spectateur, debout et bras levés pour la plupart.
          c.drawImage(seatTile(th, band, (x * 7 + y * 3) % 8), X, Y, TS, TS);
          for (const f of fansAt(x, y)) {
            const up = hash(x, f.k, y) < 0.7,
              jump = up ? Math.round(Math.abs(Math.sin(time * 0.35 + f.hsh * 9)) * 2 * cheer) : 0,
              img = fanSprite(f.look, up);
            c.drawImage(
              img,
              X + f.dx * 3,
              Y + (STAND.seat - img.height + 1 - jump) * 3,
              img.width * 3,
              img.height * 3
            );
          }
        }
      c.restore();
    }
    // Portail de retour en pixels : anneau de pierre runique et tourbillon à la couleur de l'instance.
    function drawExitPortal(c, th) {
      const inst = game.world.instance;
      if (!inst || inst.arena || !inst.cleared) return;
      const e = exitSpot(inst.index);
      if (!e) return;
      const x = e.x * TS + 24,
        y = e.y * TS + 24,
        U = 3,
        R2 = (px, py, w, h, col) => {
          c.fillStyle = col;
          c.fillRect(Math.round(x + px * U), Math.round(y + py * U), w * U, h * U);
        };
      // Ombre et socle.
      c.save();
      c.globalAlpha = 0.35;
      c.fillStyle = '#05040a';
      c.beginPath();
      c.ellipse(x, y + 22, 30, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      R2(-9, 6, 18, 2, '#1a1210');
      R2(-8, 5, 16, 2, th.pillar[1]);
      R2(-8, 5, 16, 1, th.pillar[2]);
      // Anneau de pierre cerclé d'encre et ses runes qui tournent.
      c.save();
      for (const [rx, ry, col] of [
        [11, 14, '#1a1210'],
        [10, 13, th.pillar[0]],
        [8, 11, '#06040a']
      ]) {
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(x, y - 14, rx * U, ry * U, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Tourbillon : bandes de la couleur des runes, qui tournent.
      c.globalAlpha = 0.9;
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = k === 1 ? '#ffffff' : th.rune;
        c.lineWidth = U * 2;
        const a = time * 0.06 + (k * Math.PI * 2) / 3;
        c.beginPath();
        c.ellipse(x, y - 14, (7 - k * 2) * U, (10 - k * 2.5) * U, 0, a, a + 2.2);
        c.stroke();
      }
      c.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.08);
      c.fillStyle = th.rune;
      c.beginPath();
      c.ellipse(x, y - 14, 3 * U, 4 * U, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + time * 0.02;
        R2(Math.cos(a) * 9.5 - 0.5, Math.sin(a) * 12.5 - 5, 1, 1, k % 2 ? th.rune : '#ffffff');
      }
      // Étincelles qui montent.
      for (let k = 0; k < 5; k++) {
        const ph = (time * 0.01 + k / 5) % 1;
        c.globalAlpha = 1 - ph;
        R2(Math.sin(k * 2.1 + time * 0.03) * 6, 2 - ph * 22, 1, 1, th.rune);
      }
      c.globalAlpha = 1;
      canaanLight(x, y - 14, 190, th.rune);
      const near = exitNear(P);
      drawCanaanPrompt(c, near ? '[E] Sortir de l’instance' : '🌀 Portail de retour', x, y - 62);
    }
    // Textures et cases en pixel art (client/art/dungeon-tiles.js).
    const {
      canvas,
      rect,
      specks,
      paintFloor,
      paintFace,
      paintHazard,
      toRgb,
      mixHex,
      themeArt,
      shadowTile,
      drawScrolled
    } = CANAAN_DUNGEON_TILES.create({
      THEMES,
      hash,
      field
    });
    // ---------------------------------------------------------------- Sol peint comme l'île et les Tréfonds
    // Même moteur que les Tréfonds (under-look.js) : sols continus en motifs sans couture, bords organiques, vraies
    // faces de falaise ou de maçonnerie avec leur ombre portée, dangers animés (eaux, lave, sang, nuées) et gouffres
    // qui plongent dans le noir. Les cases de l'instance y sont traduites : sol, allée (chaussée), danger (eaux ou
    // gouffre), tout le reste en roche ; les objets posés au sol comptent comme du sol, une herse comme ce qu'elle
    // ferme. Un rendu par instance, ses blocs peints à l'entrée puis gardés.
    const V = {
      FLOOR: 1,
      PATH: 2,
      WALL: 3,
      LAKE: 4,
      CHASM: 5,
      STONE: -1,
      GRAVE: -2,
      MOSS: -3,
      MUD: -4,
      RIVER: -5
    };
    const DEEP = new Set(['chasm', 'void', 'stars']);
    // Un rendu par instance ; seuls les blocs de la dernière instance visitée sont gardés : y revenir (nouvel essai,
    // farm) réaffiche son sol tout de suite au lieu de le repeindre.
    const LOOKS = new Map();
    let lastLook = null;
    function lookFor(i) {
      if (LOOKS.has(i)) return LOOKS.get(i);
      if (!window.CANAAN_UNDER_LOOK) return null;
      const th = THEMES[i],
        hz = th.hazard,
        deep = DEEP.has(hz.style),
        hzTile = deep ? V.CHASM : V.LAKE,
        under = new Map();
      let underFor = null;
      // Ce que ferme chaque herse (sol ou allée), relu à chaque entrée (le plan est le même, les cases non).
      const gateUnder = (plan, k) => {
        if (underFor !== plan) {
          under.clear();
          for (const g of plan.gates) g.cells.forEach(([x, y], n) => under.set(y * MAPW + x, g.under[n]));
          underFor = plan;
        }
        return under.get(k);
      };
      const at = (x, y) => {
        const plan = planFor(i),
          k = y * MAPW + x;
        if (plan.solid.has(k)) return V.FLOOR;
        // Dans l'instance : ses cases du moment ; ailleurs (sol préparé avant d'entrer) : le plan neuf, tout fermé.
        let t = (game.world.instance?.index === i ? game.world.tiles : plan.grid)[y]?.[x];
        if (t === GATE) t = gateUnder(plan, k) ?? FLOOR;
        if (t === ACCENT) return V.PATH;
        if (t === HAZARD) return hzTile;
        if (WALKABLE(t)) return V.FLOOR;
        return V.WALL;
      };
      const rgbOf = h => (h ? toRgb(h) : null),
        floorStyle = th.floor.style === 'stone' ? 'stone' : th.floor.style,
        hazardPal = { a: hz.a, b: hz.b, c: hz.c };
      const lavaLike = hz.style === 'lava',
        liquidLook = (w, b) => {
          if (w !== hzTile) return null;
          const A = toRgb(hz.a),
            B = toRgb(hz.b),
            C = toRgb(hz.c),
            mid = (p, q, t) => p.map((v, k) => v + (q[k] - v) * t);
          if (lavaLike)
            return {
              tones: [A, mid(A, B, 0.5), B, mid(B, C, 0.4)],
              glints: [hz.c, '#fff6c0'],
              speed: 0.35,
              streak: 1.8
            };
          if (hz.style === 'clouds')
            return {
              tones: [A, mid(A, B, 0.5), B, mid(B, C, 0.5)],
              glints: ['#ffffff', hz.c],
              speed: 0.3,
              streak: 2.6
            };
          if (hz.style === 'stars' || hz.style === 'void')
            return {
              tones: [A, mid(A, B, 0.3), mid(A, B, 0.6), B],
              glints: [hz.c, '#ffffff'],
              speed: 0.08,
              streak: 1
            };
          return null;
        };
      const look = CANAAN_UNDER_LOOK.create({
        T: V,
        at,
        biomeAt: () => 0,
        bridges: new Map(),
        WET: new Set([hzTile]),
        BIOMES: [{ floor: V.FLOOR, lake: hazardPal, river: hazardPal, mud: th.floor }],
        themeOf: () => ({
          wall: { ...th.wall, style: th.wall.style === 'rock' ? 'rock' : 'brick' },
          floors: { [V.FLOOR]: { ...th.floor, style: floorStyle }, [V.PATH]: th.accent }
        }),
        dress: (b, t) => {
          const p = t === V.PATH ? th.accent : th.floor;
          return {
            pebbles: p.style === 'dirt' ? 0.05 : 0.02,
            rune: p.style === 'flagstone' || p.style === 'tiles' ? rgbOf(th.rune) : null,
            glow:
              rgbOf(p.glow) ||
              (p.style === 'grate' ? rgbOf(p.c) : p.style === 'basalt' ? rgbOf(hz.glow) : null),
            joint: p.style === 'marble' ? rgbOf(p.c) : null
          };
        },
        // Dessus des murs bien plus sombre que le sol : on lit tout de suite où l'on peut marcher.
        rockPal: () => ({
          a: mixHex(th.wall.top, '#000000', 0.15),
          b: mixHex(th.wall.top, '#000000', 0.45),
          c: mixHex(th.wall.top, th.wall.dark, 0.45)
        }),
        rockAmp: () => (th.wall.style === 'rock' ? 0.7 : 0.12),
        rockSharp: th.wall.style === 'rock' ? 1.3 : 2.2,
        pathSharp: th.accent.style !== 'gravel',
        pathBorder: th.accent.style === 'carpet' ? () => toRgb(th.accent.c) : null,
        deep: w => deep && w === hzTile,
        liquidLook,
        // Le plan est le même à chaque entrée : les blocs restent valables d'une entrée à l'autre. Seuls les passages
        // secrets changent le sol (les herses sont lues comme ce qu'elles ferment) : syncSecrets repeint leurs blocs.
        key: () => 0,
        live: () => game.world.instance?.index === i,
        afterChunk: (g, x0, y0, x1, y1) => {
          if (th.accent.style === 'rails')
            for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) rails(g, x, y, at, th.accent);
        }
      });
      LOOKS.set(i, look.active() ? look : null);
      return LOOKS.get(i);
    }
    // Voie de mine : traverses de bois et deux rails d'acier, dans le sens de l'allée.
    function rails(g, x, y, at, ac) {
      if (at(x, y) !== V.PATH) return;
      const X = x * TS,
        Y = y * TS,
        same = (xx, yy) => at(xx, yy) === V.PATH,
        horizontal = same(x - 1, y) || same(x + 1, y),
        vertical = same(x, y - 1) || same(x, y + 1);
      if (vertical || !horizontal)
        for (let k = 3; k < 48; k += 12) {
          g.fillStyle = 'rgba(0,0,0,.35)';
          g.fillRect(X + 9, Y + k + 5, 32, 2);
          g.fillStyle = ac.b;
          g.fillRect(X + 8, Y + k, 32, 5);
          g.fillStyle = 'rgba(255,230,190,.18)';
          g.fillRect(X + 8, Y + k, 32, 1);
        }
      if (horizontal)
        for (let k = 3; k < 48; k += 12) {
          g.fillStyle = 'rgba(0,0,0,.35)';
          g.fillRect(X + k + 5, Y + 9, 2, 32);
          g.fillStyle = ac.b;
          g.fillRect(X + k, Y + 8, 5, 32);
        }
      if (vertical || !horizontal)
        for (const vx of [12, 33]) {
          g.fillStyle = '#1a1614';
          g.fillRect(X + vx + 1, Y, 3, 48);
          g.fillStyle = ac.c;
          g.fillRect(X + vx, Y, 2, 48);
        }
      if (horizontal)
        for (const vy of [12, 33]) {
          g.fillStyle = '#1a1614';
          g.fillRect(X, Y + vy + 1, 48, 3);
          g.fillStyle = ac.c;
          g.fillRect(X, Y + vy, 48, 2);
        }
    }
    // Passages secrets ouverts quand les blocs gardés de chaque instance ont été peints. Dès qu'ils diffèrent de l'état
    // de l'exploration (ouverture en jeu, ou nouvelle entrée où tout est refermé), seuls les blocs touchés sont repeints ;
    // un passage qui se referme est repeint sans réafficher l'ancienne image (la salle cachée ne doit pas se montrer).
    // L'Arène n'a aucun passage secret.
    const paintedSecrets = new Map();
    function syncSecrets(i, look, bits = dunState()?.secrets ?? 0) {
      const was = paintedSecrets.get(i) ?? 0;
      if (bits === was) return;
      const plan = planFor(i);
      (plan.secretWalls || []).forEach((w, k) => {
        if (!((bits ^ was) & (1 << k))) return;
        const cells = [...w.cells, ...(plan.masks[k] || [])];
        let x0 = 1e9,
          y0 = 1e9,
          x1 = -1,
          y1 = -1;
        for (const [x, y] of cells) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
        look.forget(x0, y0, x1, y1, !(bits & (1 << k)));
      });
      paintedSecrets.set(i, bits);
    }
    // Nouvelle instance : les blocs de la précédente sont libérés (mémoire graphique).
    function keepOnly(i) {
      if (lastLook === i) return;
      if (lastLook !== null) {
        LOOKS.get(lastLook)?.release();
        paintedSecrets.delete(lastLook);
      }
      lastLook = i;
    }
    // Sol préparé avant d'entrer (panneau du portail ouvert) : les blocs visibles à l'arrivée sont peints quand le
    // navigateur a du temps libre, un morceau à la fois. S'arrête une fois prêts, à l'entrée, ou si une autre instance
    // est préparée ou visitée entre-temps.
    let warming = null;
    function prewarm(i) {
      if (game.world.instance || typeof requestIdleCallback !== 'function') return;
      const look = planFor(i) && lookFor(i);
      if (!look?.warm) return;
      keepOnly(i);
      // Blocs peints sur le plan neuf : tous les passages secrets fermés, comme à l'entrée.
      syncSecrets(i, look, 0);
      themeArt(i);
      // Cadre de l'écran centré sur le héros à l'arrivée (même calcul que la boucle de rendu).
      const ex = DUNGEON_ENTRY.x * TS,
        ey = DUNGEON_ENTRY.y * TS,
        x0 = Math.max(0, Math.floor((ex - W / 2) / TS) - 1),
        x1 = Math.min(MAPW, Math.ceil((ex + W / 2) / TS) + 1),
        y0 = Math.max(0, Math.floor((ey - H / 2) / TS) - 1),
        y1 = Math.min(MAPH, Math.ceil((ey + H / 2) / TS) + 1),
        job = (warming = {}),
        // Arène : ses tribunes ensuite, une fois le sol prêt.
        stands = i === 'arena' ? warmStands() : null;
      let groundReady = false;
      const step = deadline => {
        if (warming !== job || lastLook !== i || game.world.instance) return;
        const end = performance.now() + Math.max(2, Math.min(8, (deadline?.timeRemaining?.() ?? 6) - 1));
        groundReady ||= look.warm(x0, x1, y0, y1, end);
        let done = groundReady && !stands;
        if (groundReady && stands) {
          while (performance.now() < end && !(done = !!stands.next().done));
        }
        if (done) warming = null;
        else requestIdleCallback(step, { timeout: 400 });
      };
      requestIdleCallback(step, { timeout: 400 });
    }
    // Sol de l'instance à l'écran : peint par blocs ; sans canevas (tests), case par case.
    function drawDungeonGround(c, x0, x1, y0, y1) {
      const i = game.world.instance.index,
        look = lookFor(i);
      keepOnly(i);
      if (look) syncSecrets(i, look);
      if (!look || !look.drawGround(c, x0, x1, y0, y1)) {
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++) drawDungeonTile(c, x, y, game.world.tiles[y][x]);
        return;
      }
      // Par-dessus : lézarde des passages secrets qu'on examine, étincelles de la lave et des étoiles.
      const th = THEMES[i],
        plan = planFor(i);
      for (const w of plan.secretWalls || [])
        if (w.kind === 'wall')
          for (const [x, y] of w.cells) if (game.world.tiles[y]?.[x] === SECRET) crack(c, x, y);
      if (th.hazard.style === 'lava' || th.hazard.style === 'stars')
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++) {
            if (game.world.tiles[y][x] !== HAZARD) continue;
            const tw = hash(x, y, Math.floor(time / 20));
            if (tw > 0.85) {
              c.fillStyle = th.hazard.c;
              c.fillRect(x * TS + Math.floor(tw * 20) * 2, y * TS + Math.floor((tw * 977) % 20) * 2, 4, 4);
            }
          }
    }
    // Dessin d'une case d'instance, appelé par la boucle de rendu à la place des tuiles du monde.
    function drawDungeonTile(c, x, y, t) {
      if (t === SECRET) {
        // Passage secret fermé : un mur comme les autres. Celui qu'on ouvre en l'examinant porte une fine lézarde et
        // un filet de poussière, qu'on ne voit qu'en s'en approchant ; les autres s'ouvrent par une torche ou une statue.
        drawDungeonTile(c, x, y, WALL);
        const plan = planFor(game.world.instance.index),
          wall = plan.secretWalls.find(w => w.cells.some(([cx, cy]) => cx === x && cy === y));
        if (wall?.kind === 'wall') crack(c, x, y);
        return;
      }
      drawTile(c, x, y, t);
    }
    // Fine lézarde et filet de poussière d'un passage secret qu'on examine, visibles seulement de près.
    function crack(c, x, y) {
      {
        const d = Math.hypot(P.x / TS - (x + 0.5), P.y / TS - (y + 0.5));
        if (d > 3.2) return;
        const X = x * TS,
          Y = y * TS;
        c.globalAlpha = Math.min(1, (3.2 - d) / 1.6) * 0.75;
        c.fillStyle = 'rgba(10,8,6,1)';
        for (const [px, py, w, h] of [
          [22, 16, 2, 7],
          [20, 23, 2, 6],
          [23, 29, 2, 5],
          [16, 33, 5, 2]
        ])
          c.fillRect(X + px, Y + py, w, h);
        c.globalAlpha = 1;
        if (Math.floor(time / 9 + x * 3) % 9 === 0) {
          c.fillStyle = 'rgba(220,200,170,.5)';
          c.fillRect(X + 21, Y + 36 + ((time * 0.5) % 10), 2, 2);
        }
      }
    }
    // Case d'instance en pixel art (sans canevas complet, ou si le sol peint est indisponible).
    function drawTile(c, x, y, t) {
      const i = game.world.instance.index,
        th = THEMES[i],
        art = themeArt(i),
        plan = planFor(i),
        X = x * TS,
        Y = y * TS,
        v = (x * 7 + y * 13) & 3,
        at = (xx, yy) => {
          const n = tileAt(xx, yy);
          return plan.solid.has(yy * MAPW + xx) ? FLOOR : n === SECRET ? WALL : n;
        };
      if (t === WALL && !plan.solid.has(y * MAPW + x)) {
        const below = at(x, y + 1);
        if (WALKABLE(below) || below === GATE || below === HAZARD) {
          c.drawImage(art.face[v], X, Y);
          return;
        }
        const open = n => WALKABLE(n) || n === HAZARD || n === GATE,
          near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x - 1, y + 1), at(x + 1, y + 1), at(x, y + 2)];
        if (!near.some(open)) {
          // Roche pleine, loin des salles : presque noire.
          c.drawImage(art.top, X, Y);
          c.globalAlpha = 0.55;
          c.fillStyle = '#000';
          c.fillRect(X, Y, TS, TS);
          c.globalAlpha = 1;
          return;
        }
        // Sommet du mur au bord d'une salle : pierre visible et arête claire côté sol.
        c.fillStyle = th.wall.dark;
        c.fillRect(X, Y, TS, TS);
        c.globalAlpha = 0.5;
        c.drawImage(art.top, X, Y);
        c.globalAlpha = 1;
        c.fillStyle = th.wall.light;
        if (open(near[0])) c.fillRect(X, Y, 4, TS);
        if (open(near[1])) c.fillRect(X + TS - 4, Y, 4, TS);
        if (open(near[2])) c.fillRect(X, Y, TS, 4);
        return;
      }
      if (t === HAZARD) {
        const h = th.hazard,
          speed = h.style === 'lava' ? 0.12 : h.style === 'water' ? 0.25 : h.style === 'clouds' ? 0.18 : 0.03;
        drawScrolled(c, art.hazard[v], X, Y, time * speed + y * 9);
        if (h.style === 'lava' || h.style === 'stars') {
          const tw = hash(x, y, Math.floor(time / 20));
          if (tw > 0.85) {
            c.fillStyle = h.c;
            c.fillRect(X + tw * 40, Y + ((tw * 977) % 40), 3, 3);
          }
        }
        // Rebord : falaise sous un sol (gouffre, vide) ou margelle de pierre (liquides).
        const above = at(x, y - 1);
        if (WALKABLE(above) || above === GATE) {
          const deep =
            h.style === 'chasm' || h.style === 'void' || h.style === 'stars' || h.style === 'clouds';
          c.fillStyle = deep ? th.floor.b : th.wall.dark;
          c.fillRect(X, Y, TS, deep ? 14 : 5);
          if (deep) {
            c.globalAlpha = 0.5;
            c.fillStyle = '#000';
            c.fillRect(X, Y + 14, TS, 6);
            c.globalAlpha = 1;
          }
        }
        return;
      }
      // Sols, chemins et herses (dessinées ensuite par le décor).
      const accent =
        t === ACCENT ||
        (t === GATE &&
          plan.gates.some(g => g.cells.some(([gx, gy], k) => gx === x && gy === y && g.under[k] === ACCENT)));
      c.drawImage(accent ? art.accent[v] : art.floor[v], X, Y);
      if (accent) {
        const ac = th.accent,
          same = (xx, yy) => {
            const n = tileAt(xx, yy);
            return n === ACCENT || n === GATE;
          };
        if (ac.style === 'rails') {
          const horizontal = same(x - 1, y) || same(x + 1, y),
            vertical = same(x, y - 1) || same(x, y + 1);
          c.fillStyle = ac.b;
          if (vertical || !horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + 8, Y + k, 32, 5);
          if (horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + k, Y + 8, 5, 32);
          c.fillStyle = ac.c;
          if (vertical || !horizontal) {
            c.fillRect(X + 12, Y, 3, 48);
            c.fillRect(X + 33, Y, 3, 48);
          }
          if (horizontal) {
            c.fillRect(X, Y + 12, 48, 3);
            c.fillRect(X, Y + 33, 48, 3);
          }
        } else if (ac.style === 'carpet') {
          c.fillStyle = ac.c;
          if (!same(x - 1, y)) c.fillRect(X, Y, 4, TS);
          if (!same(x + 1, y)) c.fillRect(X + TS - 4, Y, 4, TS);
          if (!same(x, y - 1)) c.fillRect(X, Y, TS, 4);
          if (!same(x, y + 1)) c.fillRect(X, Y + TS - 4, TS, 4);
        }
      }
      const up = at(x, y - 1);
      if (up === WALL) c.drawImage(shadowTile(), X, Y);
    }

    // Décor (client/art/dungeon-decor.js).
    const { R, flame, drawWallProp, drawFloorProp, drawCenterpiece, drawDecal, drawGate } =
      CANAAN_DUNGEON_DECOR.create({
        canvas,
        rect,
        mixHex,
        TS,
        now: () => time,
        // world-look.js remplace canaanLight pendant certaines passes : relu à chaque appel.
        canaanLight: (...args) => canaanLight(...args)
      });
    // ---------------------------------------------------------------- Objets de l'exploration
    // Dessinés en gros pixels de 3 px, aplats de 3 tons et contour sombre, comme les bâtiments de l'île.
    const INK = '#1a1210';
    function px3(c, x, y, w, h, col) {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), w * 3, h * 3);
    }
    // Rectangle de pixels cerné d'encre.
    function block(c, x, y, w, h, col) {
      px3(c, x - 3, y - 3, w + 2, h + 2, INK);
      px3(c, x, y, w, h, col);
    }
    function sigil(c, id, x, y, lit, size = 14) {
      const sg = SIGILS[id];
      c.save();
      c.font = canaanGlyphFont(size, 'bold');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = INK;
      c.fillText(sg.sym, x + 1, y + 1);
      c.fillStyle = lit ? sg.col : '#8a8070';
      c.fillText(sg.sym, x, y);
      c.restore();
      if (lit) canaanLight(x, y, 70, sg.col);
    }
    function drawLever(c, p, th, down) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      block(c, X + 3, Y + 27, 8, 4, th.pillar[1]);
      px3(c, X + 3, Y + 27, 8, 1, th.pillar[2]);
      // Manche : relevé (vers le haut à gauche) ou abaissé (vers le bas à droite), pommeau coloré.
      const pts = down
        ? [
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3]
          ]
        : [
            [0, 0],
            [-1, -1],
            [-2, -2],
            [-3, -3]
          ];
      for (const [dx, dy] of pts) px3(c, X + 15 + dx * 3, Y + 21 + dy * 3 + (down ? 0 : 0), 1, 1, '#6a4a30');
      const [ex, ey] = pts[3];
      block(c, X + 15 + ex * 3 - 1, Y + 21 + ey * 3 - 3, 2, 2, down ? SIGILS[p.id].col : '#c84a3a');
      sigil(c, p.id, X + 15, Y - 6, down);
    }
    function drawBrazierOff(c, p, th, lit) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      for (const dx of [1, 8]) block(c, X + dx * 3, Y + 21, 1, 6, '#3a3a40');
      block(c, X + 3, Y + 15, 8, 3, '#4a4a52');
      px3(c, X + 3, Y + 15, 8, 1, '#6a6a72');
      px3(c, X + 6, Y + 12, 2, 1, lit ? '#3a2014' : '#2a2a2e');
      if (lit) {
        flame(c, p.x * TS + 24, Y + 14, 1.1, th.flame, p.x + p.y);
        canaanLight(p.x * TS + 24, Y + 6, 150, th.flame[1]);
      } else {
        // Braises froides et filet de fumée.
        px3(c, X + 9, Y + 12, 1, 1, '#5a4a40');
        c.fillStyle = 'rgba(150,140,140,.35)';
        c.fillRect(X + 22, Y + 4 - ((time * 0.3) % 12), 3, 3);
      }
    }
    function drawStele(c, p, th, lock) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 6;
      block(c, X, Y + 6, 8, 12, th.pillar[0]);
      px3(c, X, Y + 6, 8, 1, th.pillar[2]);
      px3(c, X + 21, Y + 6, 1, 12, th.pillar[1]);
      px3(c, X - 3, Y + 39, 10, 2, th.pillar[1]);
      for (let k = 0; k < 4; k++) px3(c, X + 3, Y + 15 + k * 6, 6, 1, th.pillar[1]);
      // Symboles de la séquence (leviers, dalles) ou flamme gravée (braseros) au fronton.
      if (lock.type !== 'braziers') {
        c.fillStyle = th.rune;
        c.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.06 + p.x);
        c.fillRect(X + 9, Y + 9, 6, 3);
        c.globalAlpha = 1;
      }
      canaanLight(X + 12, Y + 18, 60, th.rune);
    }
    function drawPlate(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS;
      c.fillStyle = INK;
      c.fillRect(X + 3, Y + 3, 42, 42);
      c.fillStyle = lit ? SIGILS[p.id].col : th.pillar[1];
      c.fillRect(X + 6, Y + 6, 36, 36);
      c.fillStyle = lit ? '#ffffff' : th.pillar[0];
      c.fillRect(X + 6, Y + 6, 36, 3);
      c.fillStyle = INK;
      c.fillRect(X + 9, Y + 39, 30, 3);
      sigil(c, p.id, X + 24, Y + 25, lit, 18);
    }
    function drawTreasure(c, p) {
      const X = p.x * TS + 3,
        Y = p.y * TS + 12;
      // Tas de pièces d'or, gemmes et un calice.
      block(c, X + 3, Y + 18, 12, 4, '#c8961e');
      block(c, X + 9, Y + 12, 6, 3, '#e8b830');
      px3(c, X + 6, Y + 18, 2, 1, '#fff0a0');
      px3(c, X + 21, Y + 12, 1, 1, '#fff0a0');
      px3(c, X + 30, Y + 21, 1, 1, '#ff5070');
      px3(c, X + 9, Y + 21, 1, 1, '#7de0ff');
      block(c, X + 27, Y + 6, 2, 3, '#d8a838');
      px3(c, X + 24, Y + 3, 4, 1, '#ffd36d');
      if (Math.floor(time / 12 + p.x) % 5 === 0) px3(c, X + 15, Y + 9, 1, 1, '#ffffff');
      canaanLight(X + 21, Y + 18, 90, '#ffd36d');
    }
    // Porte scellée : dalle de pierre cerclée de fer, sceau lumineux du mécanisme qui la tient.
    function drawDoor(c, g, th, lock) {
      const xs = g.cells.map(cl => cl[0]),
        ys = g.cells.map(cl => cl[1]),
        X = Math.min(...xs) * TS,
        Y = Math.min(...ys) * TS,
        w = (Math.max(...xs) - Math.min(...xs) + 1) * TS,
        h = (Math.max(...ys) - Math.min(...ys) + 1) * TS;
      c.fillStyle = INK;
      c.fillRect(X, Y, w, h);
      c.fillStyle = th.pillar[1];
      c.fillRect(X + 3, Y + 3, w - 6, h - 6);
      c.fillStyle = th.pillar[0];
      for (let k = 0; k < (w > h ? w : h); k += 24)
        w > h ? c.fillRect(X + k + 3, Y + 6, 18, h - 15) : c.fillRect(X + 6, Y + k + 3, w - 15, 18);
      c.fillStyle = '#3a3a40';
      if (w > h) c.fillRect(X, Y + h / 2 - 3, w, 6);
      else c.fillRect(X + w / 2 - 3, Y, 6, h);
      const cx = X + w / 2,
        cy = Y + h / 2,
        pulse = 0.6 + 0.4 * Math.sin(time * 0.07);
      c.fillStyle = INK;
      c.fillRect(cx - 15, cy - 15, 30, 30);
      c.fillStyle = th.pillar[2];
      c.fillRect(cx - 12, cy - 12, 24, 24);
      c.globalAlpha = pulse;
      c.fillStyle = th.rune;
      c.fillRect(cx - 6, cy - 6, 12, 12);
      c.globalAlpha = 1;
      c.font = canaanGlyphFont(14, 'bold');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = INK;
      c.fillText(
        {
          braziers: '🔥',
          levers: '⚙',
          runes: '✦',
          guardian: '⚔',
          mirrors: '◈',
          memory: '♪',
          toggles: '⭐',
          search: '💠',
          ambush: '☠'
        }[lock.type],
        cx,
        cy + 1
      );
      c.textBaseline = 'alphabetic';
      canaanLight(cx, cy, 120, th.rune);
    }
    // Miroir sur pivot : une plaque d'argent inclinée en « / » ou en « \ ».
    function drawMirror(c, p, th, slash) {
      const X = p.x * TS,
        Y = p.y * TS;
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath();
      c.ellipse(X + 24, Y + 40, 15, 5, 0, 0, Math.PI * 2);
      c.fill();
      block(c, X + 15, Y + 33, 6, 3, th.pillar[1]);
      px3(c, X + 15, Y + 33, 6, 1, th.pillar[2]);
      c.save();
      c.translate(X + 24, Y + 20);
      c.rotate(slash ? Math.PI / 4 : -Math.PI / 4);
      c.fillStyle = INK;
      c.fillRect(-19, -6, 38, 12);
      c.fillStyle = '#b8c8d8';
      c.fillRect(-16, -3, 32, 6);
      c.fillStyle = '#ffffff';
      c.fillRect(-16, -3, 32, 2);
      c.restore();
    }
    function drawEmitter(c, p, th) {
      const X = p.x * TS,
        Y = p.y * TS,
        [dx, dy] = p.dir;
      block(c, X + 9, Y + 18, 10, 8, th.pillar[1]);
      px3(c, X + 9, Y + 18, 10, 1, th.pillar[2]);
      c.fillStyle = '#fff6c8';
      c.beginPath();
      c.arc(X + 24 + dx * 10, Y + 24 + dy * 10, 7 + Math.sin(time * 0.15), 0, Math.PI * 2);
      c.fill();
      canaanLight(X + 24, Y + 24, 140, '#fff0b0');
    }
    function drawMirrorTarget(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS;
      block(c, X + 12, Y + 33, 8, 3, th.pillar[1]);
      c.fillStyle = INK;
      c.beginPath();
      c.moveTo(X + 24, Y - 4);
      c.lineTo(X + 38, Y + 18);
      c.lineTo(X + 24, Y + 38);
      c.lineTo(X + 10, Y + 18);
      c.fill();
      c.fillStyle = lit ? '#fff6c8' : th.rune;
      c.globalAlpha = lit ? 1 : 0.55;
      c.beginPath();
      c.moveTo(X + 24, Y + 1);
      c.lineTo(X + 34, Y + 18);
      c.lineTo(X + 24, Y + 33);
      c.lineTo(X + 14, Y + 18);
      c.fill();
      c.globalAlpha = 1;
      canaanLight(X + 24, Y + 18, lit ? 220 : 80, lit ? '#fff6c8' : th.rune);
    }
    // Rayon de lumière : de l'émetteur, rebondissant sur les miroirs, jusqu'au mur ou au cristal.
    function drawBeam(c, pts, lit) {
      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (const [w, col, a] of /** @type {[number, string, number][]} */ ([
        [14, lit ? '#fff2a0' : '#ffe08a', 0.25],
        [6, '#fff6c8', 0.8],
        [2, '#ffffff', 1]
      ])) {
        c.globalAlpha = a * (0.85 + 0.15 * Math.sin(time * 0.2));
        c.strokeStyle = col;
        c.lineWidth = w;
        c.beginPath();
        pts.forEach(([x, y], k) => (k ? c.lineTo : c.moveTo).call(c, x * TS + 24, y * TS + 20));
        c.stroke();
      }
      c.restore();
    }
    // Pierre d'écho : une cloche de pierre qui vibre quand elle chante.
    function drawEchoStone(c, p, th, singing) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 4;
      block(c, X, Y + 18, 8, 8, th.pillar[0]);
      px3(c, X, Y + 18, 8, 1, th.pillar[2]);
      block(c, X + 6, Y + 6, 4, 4, th.pillar[1]);
      px3(c, X - 3, Y + 42, 10, 2, th.pillar[1]);
      if (singing)
        for (let k = 0; k < 3; k++) {
          c.globalAlpha = 0.6 - k * 0.18;
          c.strokeStyle = th.rune;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(X + 12, Y + 14, 12 + k * 9 + ((time * 0.6) % 9), 0, Math.PI * 2);
          c.stroke();
        }
      c.globalAlpha = 1;
      canaanLight(X + 12, Y + 18, singing ? 140 : 60, th.rune);
    }
    function drawEchoCrystal(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS,
        col = SIGILS[p.id].col;
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath();
      c.ellipse(X + 24, Y + 40, 13, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = INK;
      c.beginPath();
      c.moveTo(X + 24, Y - 6);
      c.lineTo(X + 35, Y + 22);
      c.lineTo(X + 24, Y + 40);
      c.lineTo(X + 13, Y + 22);
      c.fill();
      c.fillStyle = col;
      c.globalAlpha = lit ? 1 : 0.42;
      c.beginPath();
      c.moveTo(X + 24, Y - 1);
      c.lineTo(X + 31, Y + 22);
      c.lineTo(X + 24, Y + 35);
      c.lineTo(X + 17, Y + 22);
      c.fill();
      c.globalAlpha = 1;
      sigil(c, p.id, X + 24, Y + 18, lit, 13);
      if (lit) canaanLight(X + 24, Y + 18, 200, col);
    }
    function drawTogglePillar(c, p, th, lit) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 18;
      block(c, X, Y + 6, 8, 18, lit ? th.pillar[2] : th.pillar[1]);
      px3(c, X, Y + 6, 8, 1, th.pillar[2]);
      px3(c, X + 21, Y + 6, 1, 18, th.pillar[1]);
      px3(c, X - 3, Y + 57, 10, 2, INK);
      c.fillStyle = lit ? th.rune : '#3a3640';
      c.fillRect(X + 6, Y + 18, 12, 12);
      if (lit) {
        c.fillStyle = '#ffffff';
        c.fillRect(X + 9, Y + 21, 6, 6);
        canaanLight(X + 12, Y + 24, 150, th.rune);
      }
    }
    // Urne de terre : intacte (un éclat luit à peine quand elle cache un fragment) ou brisée.
    function drawUrn(c, p, th, broken, shard) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      if (broken) {
        for (const [dx, dy] of [
          [0, 30],
          [12, 33],
          [21, 27],
          [6, 24]
        ])
          block(c, X + dx, Y + dy, 3, 2, '#8a5a3a');
        return;
      }
      block(c, X + 6, Y + 12, 6, 2, '#6a4028');
      block(c, X + 3, Y + 18, 12, 12, '#9a6440');
      px3(c, X + 3, Y + 18, 3, 12, '#b8805a');
      px3(c, X + 3, Y + 24, 12, 1, '#6a4028');
      if (shard && Math.floor(time / 7 + p.id * 5) % 23 === 0) {
        px3(c, X + 15, Y + 21, 1, 1, '#ffffff');
        canaanLight(X + 18, Y + 24, 50, th.rune);
      }
    }
    // Torche secrète : comme les autres, mais sa flamme n'a pas la couleur du thème.
    function drawSecretTorch(c, p, th, done) {
      const cx = p.x * TS + 24,
        Y = p.y * TS,
        cols = done ? th.flame : ['#2a8a6a', '#5ae0b0', '#d8fff0'];
      R(c, cx - 2, Y + (done ? 30 : 24), 4, 14, '#4a3324');
      R(c, cx - 6, Y + (done ? 26 : 20), 12, 5, '#6f5137');
      flame(c, cx, Y + (done ? 26 : 20), 1, cols, p.x * 3 + p.y);
      canaanLight(cx, Y + 30, 170, cols[1]);
    }
    // Statue de travers : elle regarde ailleurs que ses sœurs (et se redresse une fois tournée).
    function drawSecretStatue(c, p, th, done) {
      const ax = p.x * TS + 24,
        ay = p.y * TS + 42;
      c.save();
      if (!done) {
        c.translate(ax, ay);
        c.rotate(0.14);
        c.translate(-ax, -ay);
      }
      drawFloorProp(c, { ...p, kind: 'statue' }, th);
      c.restore();
    }
    function drawPuffball(c, p) {
      const X = p.x * TS + 24,
        Y = p.y * TS + 30,
        swell = 1 + 0.12 * Math.sin(((hostTime() + p.phase) % 300) * 0.02);
      c.fillStyle = '#4a6a2a';
      c.fillRect(X - 3, Y, 6, 10);
      c.fillStyle = INK;
      c.beginPath();
      c.ellipse(X, Y - 2, 15 * swell, 12 * swell, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#9ac050';
      c.beginPath();
      c.ellipse(X, Y - 3, 12 * swell, 9 * swell, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#d8f0a0';
      c.fillRect(X - 6, Y - 9, 4, 3);
      canaanLight(X, Y, 70, '#a8e060');
    }
    // Pièges en bandes : plaques au repos, qui tremblent quand elles s'arment, puis pointes, flammes ou runes.
    function drawTraps(c, plan, th, view) {
      const kind = th.trap;
      if (plan.traps.length)
        for (const trap of plan.traps) {
          const ph = trapPhase(trap);
          for (const [x, y] of trap.cells) {
            if (!view(x, y)) continue;
            const X = x * TS,
              Y = y * TS,
              jit = ph === 1 ? Math.round(Math.sin(time * 1.3 + x) * 1.5) : 0;
            c.fillStyle = 'rgba(0,0,0,.35)';
            c.fillRect(X + 4, Y + 4, 40, 40);
            c.fillStyle = kind === 'pulse' ? th.floor.b : '#3a3638';
            c.fillRect(X + 6 + jit, Y + 6, 36, 36);
            if (kind === 'pulse') {
              c.globalAlpha = ph === 2 ? 0.95 : ph === 1 ? 0.35 + 0.3 * Math.sin(time * 0.6) : 0.18;
              c.strokeStyle = th.rune;
              c.lineWidth = 3;
              c.strokeRect(X + 12, Y + 12, 24, 24);
              c.beginPath();
              c.moveTo(X + 24, Y + 8);
              c.lineTo(X + 24, Y + 40);
              c.moveTo(X + 8, Y + 24);
              c.lineTo(X + 40, Y + 24);
              c.stroke();
              c.globalAlpha = 1;
              if (ph === 2) canaanLight(X + 24, Y + 24, 90, th.rune);
              continue;
            }
            // Trous des pointes ou buses des jets.
            c.fillStyle = INK;
            for (const [hx, hy] of [
              [12, 12],
              [30, 12],
              [21, 21],
              [12, 30],
              [30, 30]
            ])
              c.fillRect(X + hx + jit, Y + hy, 6, 6);
            if (ph !== 2) continue;
            if (kind === 'jets') {
              flame(c, X + 24, Y + 34, 1.5, th.flame, x + y);
              canaanLight(X + 24, Y + 20, 120, th.flame[1]);
            } else
              for (const [hx, hy] of [
                [12, 12],
                [30, 12],
                [21, 21],
                [12, 30],
                [30, 30]
              ]) {
                c.fillStyle = '#c8c8d0';
                c.beginPath();
                c.moveTo(X + hx, Y + hy + 6);
                c.lineTo(X + hx + 3, Y + hy - 10);
                c.lineTo(X + hx + 6, Y + hy + 6);
                c.fill();
              }
          }
        }
      for (const p of plan.puffs) if (view(p.x, p.y)) drawPuffball(c, p);
      // Spores annoncées.
      for (const z of trapZones()) {
        const k = Math.min(1, Math.max(0, (time - z.start) / Math.max(1, z.at - z.start)));
        c.globalAlpha = 0.18 + 0.3 * k;
        c.fillStyle = '#8ad040';
        c.beginPath();
        c.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 0.8;
        c.strokeStyle = '#c8f080';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
    }
    // Écho joué par la pierre : quel cristal brille à cet instant (ou -1).
    function echoLit(lock, ls) {
      if (ls.a > 0 && time - ls.t < 26) return ls.a - 1;
      if (ls.a !== 0 || !ls.t || time < ls.t) return -1;
      const k = Math.floor((time - ls.t) / 42);
      return k < lock.order.length && (time - ls.t) % 42 < 30 ? lock.order[k] : -1;
    }
    function drawExplore(c, plan, th, view) {
      const st = dunState();
      if (!st) return;
      for (const p of plan.plates)
        if (view(p.x, p.y))
          drawPlate(c, p, th, !!(st.locks[p.lock].prog & (1 << p.id)) || !!st.locks[p.lock].done);
      // Rayons des miroirs.
      plan.locks.forEach((lock, s) => {
        if (lock.type !== 'mirrors' || !view(lock.emitter.x, lock.emitter.y, 12)) return;
        const ls = st.locks[s],
          beam = ls.done ? { pts: [], lit: true } : beamPath(plan, s, ls.prog);
        if (!ls.done) drawBeam(c, beam.pts, beam.lit);
      });
      // Piliers liés : un fil de runes relie chaque pilier à ses voisins.
      plan.locks.forEach((lock, s) => {
        if (lock.type !== 'toggles' || !view(lock.items[0].x, lock.items[0].y, 12)) return;
        c.save();
        c.globalAlpha = 0.28;
        c.strokeStyle = th.rune;
        c.lineWidth = 2;
        c.setLineDash?.([6, 6]);
        c.beginPath();
        lock.items.forEach((it, k) => (k ? c.lineTo : c.moveTo).call(c, it.x * TS + 24, it.y * TS + 30));
        c.closePath();
        c.stroke();
        c.restore();
      });
      for (const p of plan.props) {
        if (!view(p.x, p.y, 4)) continue;
        if (p.hidden !== undefined && !secretOpen(p.hidden)) continue;
        if (p.kind === 'treasure') drawTreasure(c, p);
        if (p.secretTrigger !== undefined) {
          const done = secretOpen(p.secretTrigger);
          if (p.kind === 'secrettorch') drawSecretTorch(c, p, th, done);
          else drawSecretStatue(c, p, th, done);
          continue;
        }
        if (p.lock === undefined) continue;
        const lock = plan.locks[p.lock],
          ls = st.locks[p.lock],
          on = !!ls.done || !!(ls.prog & (1 << p.id));
        // Agrandis d'un tiers autour du pied (pixels de 4 px) : bien lisibles à côté du héros.
        const ax = p.x * TS + 24,
          ay = p.y * TS + 42;
        c.save();
        c.translate(ax, ay);
        c.scale(4 / 3, 4 / 3);
        c.translate(-ax, -ay);
        if (p.kind === 'lever') drawLever(c, p, th, on);
        else if (p.kind === 'brazier_off') drawBrazierOff(c, p, th, on);
        else if (p.kind === 'stele') drawStele(c, p, th, lock);
        else if (p.kind === 'mirror') drawMirror(c, p, th, (ls.prog >> p.id) & 1);
        else if (p.kind === 'emitter') drawEmitter(c, { ...p, dir: lock.emitter.dir }, th);
        else if (p.kind === 'mtarget') drawMirrorTarget(c, p, th, !!ls.done);
        else if (p.kind === 'echostone') drawEchoStone(c, p, th, echoLit(lock, ls) >= 0 && ls.a === 0);
        else if (p.kind === 'echocrystal') drawEchoCrystal(c, p, th, !!ls.done || echoLit(lock, ls) === p.id);
        else if (p.kind === 'togglepillar') drawTogglePillar(c, p, th, on);
        else if (p.kind === 'urn') drawUrn(c, p, th, !!(ls.prog & (1 << p.id)), lock.shards.includes(p.id));
        c.restore();
      }
      plan.doors.forEach(
        (g, s) =>
          g && game.world.tiles[g.cells[0][1]]?.[g.cells[0][0]] === GATE && drawDoor(c, g, th, plan.locks[s])
      );
      // Embuscade : les issues de la salle se ferment comme des herses.
      plan.locks.forEach(lock => {
        if (lock.seals)
          for (const sl of lock.seals)
            if (sl.cells.length && game.world.tiles[sl.cells[0][1]]?.[sl.cells[0][0]] === GATE)
              drawGate(c, sl, th);
      });
      // Braseros minutés : les secondes qui restent, au-dessus de la porte.
      plan.locks.forEach((lock, s) => {
        const ls = st.locks[s];
        if (lock.type !== 'braziers' || ls.done || !ls.prog || !ls.t) return;
        const left = Math.max(0, Math.ceil((ls.t - time) / 60)),
          g = plan.doors[s],
          [x, y] = g.cells[Math.floor(g.cells.length / 2)];
        canaanText(c, '⏳ ' + left, x * TS + 24, y * TS - 22, 18, left <= 5 ? '#ff6a4a' : '#ffd36d', {
          line: 4
        });
      });
      // Invitation à agir sur ce qui est à portée de main.
      const what = reachable(P);
      if (!what) return;
      let at = null,
        text = '';
      if (what.kind === 'secret') {
        const w = plan.secretWalls[what.k];
        if (w.kind === 'wall') {
          at = w.cells[1] || w.cells[0];
          text = '[E] Examiner la lézarde';
        } else {
          at = [w.trigger.x, w.trigger.y + (w.trigger.wall ? 1 : 0)];
          text = w.kind === 'torch' ? '[E] Tirer la torche' : '[E] Tourner la statue';
        }
      } else if (what.kind === 'door') {
        const g = plan.doors[what.s];
        at = g.cells[Math.floor(g.cells.length / 2)];
        text = '🔒 [E] Porte scellée';
      } else if (what.kind === 'stele') {
        const lock = plan.locks[what.s];
        at = [lock.stele.x, lock.stele.y];
        text = lock.type === 'memory' ? '[E] Écouter la pierre d’écho' : '[E] Lire la stèle';
      } else {
        const it = plan.locks[what.s].items[what.id];
        at = [it.x, it.y];
        text = {
          braziers: '[E] Allumer le brasero',
          levers: '[E] Actionner le levier',
          mirrors: '[E] Tourner le miroir',
          memory: '[E] Frapper le cristal',
          toggles: '[E] Toucher le pilier',
          search: '[E] Fouiller l’urne'
        }[what.kind];
      }
      drawCanaanPrompt(c, translateText(text), at[0] * TS + 24, at[1] * TS - 18);
    }
    // Objets au sol en gros pixels cernés d'encre, comme le décor de l'île : peints une fois (leurs lumières notées),
    // réduits au tiers sans lissage, contourés, puis réutilisés. Les objets animés restent dessinés à chaque image.
    const LIVE_PROPS = new Set([
      'brazier',
      'candles',
      'gear',
      'hourglass',
      'orb',
      'furnace',
      'pillarlight',
      'crystal'
    ]);
    let propCache = { key: null, map: new Map() };
    function pixelProp(c, p, th, i) {
      if (typeof window.canaanOutline !== 'function') return drawFloorProp(c, p, th);
      // Brasero : coupe et pied peints une fois, la flamme reste animée.
      if (p.kind === 'brazier' && !p.still) {
        pixelProp(c, { ...p, still: true }, th, i);
        const cx = p.x * TS + 24,
          by = p.y * TS + 40;
        flame(c, cx, by - 22, 1.6, th.flame, p.x * 5 + p.y * 3);
        canaanLight(cx, by - 30, 220, th.flame[1]);
        return;
      }
      if (LIVE_PROPS.has(p.kind) && !p.still) return drawFloorProp(c, p, th);
      if (propCache.key !== i) propCache = { key: i, map: new Map() };
      const id = p.x + ',' + p.y + (p.still ? ':still' : '');
      let e = propCache.map.get(id);
      if (!e) {
        const big = canvas(144, 144),
          g = big.getContext('2d'),
          lights = [],
          keep = window.canaanLight;
        if (!g || !g.drawImage) return drawFloorProp(c, p, th);
        window.canaanLight = (x, y, r, col) => lights.push([x - p.x * TS, y - p.y * TS, r, col]);
        try {
          g.translate(48 - p.x * TS, 48 - p.y * TS);
          drawFloorProp(g, p, th);
        } finally {
          window.canaanLight = keep;
        }
        const small = canvas(48, 48),
          sg = small.getContext('2d');
        sg.imageSmoothingEnabled = false;
        sg.drawImage(big, 0, 0, 48, 48);
        e = { img: canaanOutline(small, 1), lights };
        propCache.map.set(id, e);
      }
      c.imageSmoothingEnabled = false;
      c.drawImage(e.img, p.x * TS - 51, p.y * TS - 51, e.img.width * 3, e.img.height * 3);
      for (const [x, y, r, col] of e.lights) canaanLight(p.x * TS + x, p.y * TS + y, r, col);
    }
    // Décor de l'instance : sols spéciaux, objets, pièce maîtresse, herses et titre.
    function drawDungeonDecor(c) {
      if (!game.world.instance) return;
      const i = game.world.instance.index,
        th = THEMES[i],
        plan = planFor(i),
        view = (x, y, m = 3) =>
          x * TS > camX - m * TS &&
          x * TS < camX + W + m * TS &&
          y * TS > camY - m * TS &&
          y * TS < camY + H + m * TS;
      const hid = o => o.hidden !== undefined && !secretOpen(o.hidden);
      for (const l of plan.lights)
        if (view(l.x, l.y) && !hid(l))
          canaanLight(l.x * TS, l.y * TS, l.r * (0.9 + Math.sin(time * 0.06 + l.x) * 0.1), l.col);
      c.save();
      if (plan.arena) drawArenaStands(c);
      if (!plan.arena) drawTraps(c, plan, th, view);
      for (const dcl of plan.decals) if (view(dcl.x, dcl.y, 4) && !hid(dcl)) drawDecal(c, dcl, th);
      for (const p of plan.props)
        if (
          view(p.x, p.y, 4) &&
          p.lock === undefined &&
          p.kind !== 'treasure' &&
          p.secretTrigger === undefined &&
          p.kind !== 'puffball' &&
          !hid(p)
        ) {
          if (p.wall) drawWallProp(c, p, th);
          else if (p.center) drawCenterpiece(c, p, th);
          else pixelProp(c, p, th, i);
        }
      for (const g of plan.gates)
        if (g && game.world.tiles[g.cells[0][1]][g.cells[0][0]] === GATE) drawGate(c, g, th);
      if (!plan.arena) {
        drawExplore(c, plan, th, view);
        drawExitPortal(c, th);
      }
      const d = instances[i],
        mode = instanceDifficulty();
      if (plan.title && view(plan.title.x, plan.title.y, 6)) {
        const name = plan.arena ? CANAAN_ARENA_NAME : d.name,
          title =
            '✦ ' +
            translateText(name).toUpperCase() +
            (mode ? ' · ' + mode.icon + ' ' + mode.label : '') +
            ' ✦';
        canaanText(c, title, plan.title.x * TS + 24, plan.title.y * TS, 18, th.rune, { line: 4 });
      }
      drawCanaanPrompt(c, '↟ SORTIE [E] ↟', instanceEntrance.x, instanceEntrance.y + 62);
      c.restore();
    }

    // Ambiance de l'instance pour l'éclairage commun (canaan-sprite-kit).
    function dungeonAmbience() {
      const th = THEMES[game.world.instance.index],
        col = {
          dust: '#d8c8a8',
          embers: '#ffb14a',
          motes: th.rune,
          sparks: th.hazard.c,
          feathers: '#ffffff'
        }[th.particles];
      // Pénombre adoucie : on voit le pixel art des salles, les torches gardent leur halo.
      const arena = game.world.instance.arena;
      return {
        dark: arena ? th.light.dark : Math.min(0.92, th.light.dark * 0.62 * (th.dark || 1)),
        tint: th.light.tint,
        particles: th.particles,
        color: col
      };
    }
    function dungeonMinimapColor(t) {
      if (!game.world.instance) return BIOME_COLORS[t];
      const th = THEMES[game.world.instance.index];
      if (t === FLOOR) return th.floor.c;
      if (t === ACCENT) return th.accent.c;
      if (t === HAZARD) return th.shape === 'void' ? '#0c0c1c' : th.hazard.b;
      if (t === GATE) return th.rune;
      return '#08080e';
    }
    return Object.freeze({
      THEMES,
      prewarm,
      drawDungeonTile,
      drawDungeonGround,
      drawDungeonDecor,
      dungeonAmbience,
      dungeonMinimapColor,
      canvas,
      rect,
      specks,
      paintFloor,
      paintFace,
      paintHazard,
      flame,
      shadowTile,
      drawFloorProp,
      drawWallProp
    });
  }
  window.CANAAN_DUNGEON_RENDER = Object.freeze({ create });
})();
