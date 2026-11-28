// Dessin des bâtiments où l'on entre : intérieurs, abords et finitions des façades ; le dessin des meubles est dans
// scripts/house/furniture.js, les façades et leurs architectures dans scripts/house/facades.js. Aucune règle ici : la place des meubles est dans shared/rules/house.js, les bâtiments et les portes dans
// scripts/house/house.js.
// house.js appelle CANAAN_HOUSE_RENDER.create(scène) une fois : la scène lui donne ses pièces, ses portes et ses
// meubles (lus à chaque image, jamais modifiés ici).
(() => {
  'use strict';
  function create(scene) {
    const {
      roomAt,
      px,
      py,
      itemsOf,
      ROOM,
      insideDoor,
      outsideDoor,
      externals,
      FLOOR_TILE,
      WALL_TILE,
      OUTSIDE_TILE
    } = scene;

    // Pendant la peinture de l'image gardée d'un bâtiment (MAT), chaque rectangle note aussi sa matière (rouge) et
    // un numéro de bloc (vert) dans une image jumelle : la finition y lit reliefs et textures, pixel par pixel.
    let MAT = null;
    const R = (g, x, y, w, h, col) => {
      const rx = Math.round(x),
        ry = Math.round(y),
        rw = Math.round(w),
        rh = Math.round(h);
      g.fillStyle = col;
      g.fillRect(rx, ry, rw, rh);
      if (MAT && g === MAT.g && g.globalAlpha >= 1 && col.length < 9) {
        const code = col === '#22160e' ? 0 : (MAT.map.get(col) ?? MAT.def);
        MAT.id = (MAT.id % 250) + 1;
        MAT.m.fillStyle = 'rgb(' + code + ',' + MAT.id + ',0)';
        MAT.m.fillRect(rx, ry, rw, rh);
      }
    };
    // État relu par les modules (scripts/house/furniture.js, scripts/house/facades.js) : variables réassignées ou posées plus tard.
    const LIVE = {
      get FX() {
        return FX;
      }
    };
    // Dessin des meubles (scripts/house/furniture.js).
    const { FURNITURE_ART } = CANAAN_HOUSE_FURNITURE.create({
      R
    });
    // Catalogue complet : métadonnées partagées et dessin (le dessin d'un meuble peut appeler this.draw).
    const CATALOG = Object.fromEntries(
      Object.entries(HOUSE_FURNITURE).map(([k, c]) => [k, { ...c, ...FURNITURE_ART[k] }])
    );
    // Ambiance de chaque intérieur, peinte avec les pinceaux des donjons (CANAAN_TILE_KIT) : sol (planches, dalles,
    // rondins, pierres plates), mur du fond (papier peint, pierre blanchie, rondins, terre crue), lambris, arêtes.
    const DESERT = new Set(['oasis', 'dunes']);
    const WOOD_EDGE = { top: '#3a2416', dark: '#24160c', light: '#7a5634' };
    const INTERIOR = Object.fromEntries(
      Object.entries({
        home: {
          floor: { style: 'planks', a: '#8a5a34', b: '#5e3c22', c: '#aa7a48' },
          wall: { style: 'paper', face: '#dcc89e', dark: '#b8a276', light: '#efe2c0', top: '#4a2e1a' },
          wains: ['#7a5230', '#553620', '#9a6c42'],
          edge: WOOD_EDGE
        },
        shop: {
          floor: { style: 'planks', a: '#a07444', b: '#74502e', c: '#c0905c' },
          wall: { style: 'paper', face: '#a8bc94', dark: '#879c74', light: '#c4d4b0', top: '#3e2a18' },
          wains: ['#6a4428', '#4a2e1a', '#8a5e38'],
          edge: WOOD_EDGE
        },
        // Maison de la Guilde : dalles de pierre, murs de pierre claire, lambris sombre.
        guild: {
          floor: { style: 'flagstone', a: '#a49a88', b: '#7c7262', c: '#c0b6a2' },
          wall: { style: 'brick', face: '#cfc4ae', dark: '#a89c84', light: '#e6dcc8', top: '#3a2a1e' },
          wains: ['#5a3c24', '#3a2414', '#7a5634'],
          edge: WOOD_EDGE
        },
        kitchen: {
          floor: { style: 'flagstone', a: '#b8b0a0', b: '#8e8678', c: '#d4ccbc' },
          wall: { style: 'brick', face: '#e8e2d4', dark: '#b8b0a0', light: '#fbf8f0', top: '#5a5248' },
          wains: ['#d8dee6', '#8a94a4', '#ffffff'],
          edge: { top: '#4a443c', dark: '#2a2620', light: '#8a8478' },
          faience: true
        },
        aubepines: {
          floor: { style: 'planks', a: '#94603a', b: '#683e22', c: '#b47c4c' },
          wall: { style: 'paper', face: '#e6c2b6', dark: '#c8a094', light: '#f6dcd2', top: '#4a2e1a' },
          wains: ['#7a5230', '#553620', '#9a6c42'],
          edge: WOOD_EDGE
        },
        puits: {
          floor: { style: 'planks', a: '#7e5634', b: '#563820', c: '#9c7048' },
          wall: { style: 'paper', face: '#b8c8e0', dark: '#94a6c2', light: '#d6e2f2', top: '#2e2438' },
          wains: ['#5a4a6a', '#3e3048', '#7a6890'],
          edge: { top: '#2e2438', dark: '#1a1420', light: '#6a5a80' }
        },
        refuge: {
          floor: { style: 'logs', a: '#7a5636', b: '#523820', c: '#9a7248' },
          wall: { style: 'logs', face: '#8a6440', dark: '#74522f', light: '#b08458', top: '#3a2414' },
          wains: ['#5a3c24', '#3a2414', '#7a5634'],
          edge: WOOD_EDGE
        },
        // Refuges du marais (pilotis), de l'automne (bardeaux roux) et de la Forêt enchantée (pierre lilas).
        pilotis: {
          floor: { style: 'planks', a: '#6a6440', b: '#46422a', c: '#8a8458' },
          wall: { style: 'logs', face: '#6a6a48', dark: '#545436', light: '#8a8a62', top: '#2e2e1c' },
          wains: ['#4a4a30', '#30301e', '#6a6a48'],
          edge: { top: '#2e2e1c', dark: '#1a1a10', light: '#6a6a48' }
        },
        rousses: {
          floor: { style: 'planks', a: '#9a5a30', b: '#6a3a1c', c: '#ba7a48' },
          wall: { style: 'paper', face: '#e8b878', dark: '#c89058', light: '#f8d4a0', top: '#5a2e18' },
          wains: ['#8a4a24', '#5a2e14', '#aa6a3a'],
          edge: WOOD_EDGE
        },
        cristaux: {
          floor: { style: 'flagstone', a: '#b8a8d8', b: '#8a7aac', c: '#d8ccf0' },
          wall: { style: 'brick', face: '#c8b8e8', dark: '#9a88c0', light: '#e8dcff', top: '#3a2a58' },
          wains: ['#7a6aa8', '#4a3a78', '#a898d8'],
          edge: { top: '#3a2a58', dark: '#20163a', light: '#8a7ab8' }
        },
        // Sylvaëlle : bois clair et lambris de feuilles (leaf), marbre et or dans la demeure de la Reine, pierre de lune au
        // temple, bleu nuit étoilé dans la tour, racines dans la Maison des Racines.
        palace: {
          floor: { style: 'flagstone', a: '#ece8e0', b: '#cfc8bc', c: '#ffffff' },
          wall: {
            style: 'leaf',
            face: '#f4f0e6',
            dark: '#d8ccb0',
            light: '#ffffff',
            top: '#8a6a1e',
            vine: '#5ea44a',
            gold: '#f0d060'
          },
          wains: ['#c8a038', '#8a6a1e', '#f0d060'],
          edge: { top: '#6a5a3a', dark: '#3a2e1c', light: '#c8b088' }
        },
        elftavern: {
          floor: { style: 'planks', a: '#b8844e', b: '#8a5e34', c: '#d8a470' },
          wall: {
            style: 'leaf',
            face: '#f2e6ca',
            dark: '#dccaa4',
            light: '#fffaf0',
            top: '#5a3c24',
            vine: '#4e8a3a',
            gold: '#f0d060'
          },
          wains: ['#8a5e38', '#5e3c22', '#b8844e'],
          edge: WOOD_EDGE
        },
        elfshop: {
          floor: { style: 'planks', a: '#c89a62', b: '#94643a', c: '#e0b882' },
          wall: {
            style: 'leaf',
            face: '#e8f0dc',
            dark: '#c8d8b4',
            light: '#f8fff0',
            top: '#3a5a2a',
            vine: '#3e7a36',
            gold: '#f0d060'
          },
          wains: ['#7a5a34', '#5a3c24', '#a87a48'],
          edge: WOOD_EDGE
        },
        elfhome: {
          floor: { style: 'planks', a: '#b8844e', b: '#8a5e34', c: '#d8a470' },
          wall: {
            style: 'leaf',
            face: '#f2e6ca',
            dark: '#dccaa4',
            light: '#fffaf0',
            top: '#4a3020',
            vine: '#5ea44a',
            gold: '#f6a0d8'
          },
          wains: ['#8a5e38', '#5e3c22', '#b8844e'],
          edge: WOOD_EDGE
        },
        elfroots: {
          floor: { style: 'logs', a: '#7a5636', b: '#523820', c: '#9a7248' },
          wall: {
            style: 'leaf',
            face: '#c8a878',
            dark: '#a8885a',
            light: '#e0c498',
            top: '#3a2414',
            vine: '#3e7a36',
            gold: '#a8d878'
          },
          wains: ['#5a3c24', '#3a2414', '#7a5634'],
          edge: WOOD_EDGE
        },
        elfstar: {
          floor: { style: 'flagstone', a: '#4a5a8a', b: '#34426a', c: '#6a7aaa' },
          wall: {
            style: 'leaf',
            face: '#2a3a6a',
            dark: '#1e2a50',
            light: '#5a6aa8',
            top: '#141c38',
            vine: '#8a9ad8',
            gold: '#fff4b0'
          },
          wains: ['#3a2e5a', '#241c3a', '#5a4a8a'],
          edge: { top: '#141c38', dark: '#0a0e20', light: '#4a5a8a' }
        },
        temple: {
          floor: { style: 'flagstone', a: '#d8dcf0', b: '#b0b4d0', c: '#f4f6ff' },
          wall: {
            style: 'leaf',
            face: '#e4e8f8',
            dark: '#c0c6e0',
            light: '#ffffff',
            top: '#4a4e78',
            vine: '#9aa8d8',
            gold: '#eef4ff'
          },
          wains: ['#8a90b8', '#5a6088', '#b0b8e0'],
          edge: { top: '#4a4e78', dark: '#2a2e50', light: '#9aa0c8' }
        },
        // Ferme du camp : planches brutes, foin.
        barn: {
          floor: { style: 'planks', a: '#9a6a3e', b: '#6a4426', c: '#b8844e' },
          wall: { style: 'logs', face: '#a85a3a', dark: '#8a4428', light: '#c87a52', top: '#4a2414' },
          wains: ['#6a3a20', '#4a2414', '#8a5030'],
          edge: WOOD_EDGE
        },
        // Durgrim : pierre taillée à runes dorées (rune), dalles et braises.
        dwarfhall: {
          floor: { style: 'flagstone', a: '#7a6e64', b: '#5a5048', c: '#9a8e80' },
          wall: {
            style: 'rune',
            face: '#6a5e54',
            dark: '#4a4038',
            light: '#8a7e70',
            top: '#2a221c',
            gold: '#e0b040'
          },
          wains: ['#5a3a22', '#3a2414', '#7a5232'],
          edge: { top: '#2a221c', dark: '#16100c', light: '#6a5e54' }
        },
        dwarfforge: {
          floor: { style: 'stone', a: '#5a5048', b: '#3e3630', c: '#786c60' },
          wall: {
            style: 'rune',
            face: '#5a4e46',
            dark: '#3a322c',
            light: '#7a6e64',
            top: '#1e1814',
            gold: '#ff9a4a'
          },
          wains: ['#4a3a2e', '#2a221c', '#6a5a4a'],
          edge: { top: '#1e1814', dark: '#0e0a08', light: '#5a4e46' }
        },
        dwarftavern: {
          floor: { style: 'planks', a: '#7a5232', b: '#553620', c: '#9a6c42' },
          wall: {
            style: 'rune',
            face: '#6e6258',
            dark: '#4e443c',
            light: '#8e8274',
            top: '#2a221c',
            gold: '#e0b040'
          },
          wains: ['#6a4428', '#4a2e1a', '#8a5e38'],
          edge: { top: '#2a221c', dark: '#16100c', light: '#6e6258' }
        },
        dwarfvault: {
          floor: { style: 'flagstone', a: '#6a6e78', b: '#4a4e58', c: '#8a8e98' },
          wall: {
            style: 'rune',
            face: '#5a5e68',
            dark: '#3a3e48',
            light: '#7a7e88',
            top: '#1e2028',
            gold: '#f0d060'
          },
          wains: ['#4a4e58', '#2a2e38', '#6a6e78'],
          edge: { top: '#1e2028', dark: '#0e1018', light: '#5a5e68' }
        },
        dwarfhome: {
          floor: { style: 'planks', a: '#7a5232', b: '#553620', c: '#9a6c42' },
          wall: {
            style: 'rune',
            face: '#7a6e64',
            dark: '#5a5048',
            light: '#9a8e80',
            top: '#2a221c',
            gold: '#c8a060'
          },
          wains: ['#6a4428', '#4a2e1a', '#8a5e38'],
          edge: { top: '#2a221c', dark: '#16100c', light: '#7a6e64' }
        },
        adobe: {
          floor: { style: 'flagstone', a: '#dcb884', b: '#b8945e', c: '#f0d4a4' },
          wall: { style: 'adobe', face: '#e8c890', dark: '#c8a46c', light: '#f8e4b8', top: '#8a5a34' },
          wains: ['#c07a44', '#8a5230', '#e09a5a'],
          edge: { top: '#8a6440', dark: '#5a3c22', light: '#c8a070' }
        }
      }).map(([id, spec]) => [id, { id, ...spec }])
    );
    const interiorOf = room =>
      DESERT.has(room.id) ? INTERIOR.adobe : INTERIOR[room.id] || INTERIOR[room.kind] || INTERIOR.home;

    // ---------------------------------------------------------------- Dessin : intérieurs
    // Pièce où se trouve le joueur (recalculée une fois par image).
    let curAt = -1,
      cur = null;
    const current = () => {
      if (curAt !== time) {
        curAt = time;
        cur = game.world.instance ? null : roomAt(P.x, P.y);
      }
      return cur;
    };
    function drawTile(c, x, y, t) {
      const here = current();
      if (here && !(x >= here.x && y >= here.y && x < here.x + here.w && y < here.y + here.h)) {
        // Dans un bâtiment, le reste du monde est dans le noir.
        R(c, x * TS, y * TS, TS, TS, '#0b0806');
        return true;
      }
      if (t === OUTSIDE_TILE) {
        const ground = PIXEL_TERRAIN[regionAt(x, y).t] || PIXEL_TERRAIN[1];
        c.drawImage(ground, ((x * 7 + y * 13) & 3) * 48, 0, 48, 48, x * TS, y * TS, TS, TS);
        return true;
      }
      if (t !== FLOOR_TILE && t !== WALL_TILE) return false;
      const room = roomAt(x * TS + 1, y * TS + 1);
      if (!room) return false;
      const X = x * TS,
        Y = y * TS,
        lx = x - room.x,
        ly = y - room.y,
        v = (x * 7 + y * 13) & 3,
        I = interiorOf(room),
        { floor: F, door: D } = houseRoomGeometry(room),
        onFloor = (ax, ay) => ax >= F.x0 && ax <= F.x1 && ay >= F.y0 && ay <= F.y1;
      if (t === FLOOR_TILE) {
        // Sol peint au pinceau des donjons ; ombre au pied du mur du fond et le long des murs latéraux.
        c.drawImage(floorTex(I, v), X, Y);
        if (ly === F.y0) c.drawImage(CANAAN_TILE_KIT.shadowTile(), X, Y);
        c.globalAlpha = 0.3;
        if (lx === F.x0) R(c, X, Y, 6, TS, '#000000');
        if (lx === F.x1) R(c, X + TS - 6, Y, 6, TS, '#000000');
        c.globalAlpha = 1;
        return true;
      }
      // Mur du fond (deux rangées) : face éclairée, couronnement, cimaise, lambris et plinthe.
      if (ly <= 1 && lx >= F.x0 && lx <= F.x1) {
        c.drawImage(wallTex(I, v), 0, ly * TS, 48, 48, X, Y, TS, TS);
        return true;
      }
      // Autres murs : sommet sombre comme dans les donjons, arête claire du côté du sol.
      c.drawImage(edgeTex(I, v), X, Y);
      const E = I.edge.light;
      if (onFloor(lx + 1, ly) || (ly <= 1 && lx + 1 === F.x0)) R(c, X + TS - 4, Y, 4, TS, E);
      if (onFloor(lx - 1, ly) || (ly <= 1 && lx - 1 === F.x1)) R(c, X, Y, 4, TS, E);
      if (onFloor(lx, ly - 1)) R(c, X, Y, TS, 4, E);
      if (ly === room.h - 1 && lx === D.x) {
        // Porte de sortie : chambranle en trois tons, linteau, battant en planches ferrées.
        R(c, X + 3, Y - 12, 42, 60, OUT);
        R(c, X + 5, Y - 10, 38, 7, '#8a6440');
        R(c, X + 5, Y - 10, 38, 2, '#b08a5e');
        R(c, X + 5, Y - 3, 7, 51, '#7a5634');
        R(c, X + 5, Y - 3, 2, 51, '#a07a50');
        R(c, X + 36, Y - 3, 7, 51, '#4a3020');
        R(c, X + 12, Y - 3, 24, 51, '#8a5a34');
        for (const dx of [6, 12, 18]) R(c, X + 12 + dx, Y - 3, 1, 51, '#5e3c22');
        R(c, X + 12, Y - 3, 24, 2, '#a87444');
        R(c, X + 12, Y + 6, 24, 3, '#3a3a40');
        R(c, X + 12, Y + 30, 24, 3, '#3a3a40');
        R(c, X + 29, Y + 18, 4, 4, '#e0c060');
        R(c, X + 29, Y + 18, 2, 2, '#fff2a0');
      }
      return true;
    }
    // ---------------------------------------------------------------- Textures des intérieurs (pinceaux des donjons)
    const TEX = new Map();
    const tex = (key, make) => {
      let t = TEX.get(key);
      if (!t) TEX.set(key, (t = make()));
      return t;
    };
    function floorTex(I, v) {
      return tex(I.id + ':sol:' + v, () => {
        const K = CANAAN_TILE_KIT,
          cv = K.canvas(48, 48);
        K.paintFloor(cv.getContext('2d'), I.floor, v, I.floor.style);
        return cv;
      });
    }
    function edgeTex(I, v) {
      return tex(I.id + ':arete:' + v, () => {
        const K = CANAAN_TILE_KIT,
          cv = K.canvas(48, 48),
          g = cv.getContext('2d');
        K.rect(g, 0, 0, 48, 48, I.edge.top);
        K.specks(g, 12, [I.edge.dark, I.edge.light], 77 + v);
        return cv;
      });
    }
    // Mur du fond : 48 × 96 (deux rangées), peint comme une face de mur de donjon.
    function wallTex(I, v) {
      return tex(I.id + ':mur:' + v, () => {
        const K = CANAAN_TILE_KIT,
          cv = K.canvas(48, 96),
          g = cv.getContext('2d'),
          r = (x, y, w, h, col) => K.rect(g, x, y, w, h, col),
          w = I.wall,
          [wa, wd, wl] = I.wains,
          hsh = (a, b) => rnd(a + v * 13, b + 7);
        r(0, 0, 48, 96, w.face);
        if (w.style === 'paper') {
          // Papier peint rayé à petits motifs.
          for (let x = 0; x < 48; x += 12) {
            g.globalAlpha = 0.35;
            r(x + 4, 10, 4, 48, w.dark);
            g.globalAlpha = 1;
            for (let y = 16; y < 56; y += 12) {
              r(x + 10, y + ((x / 12) % 2) * 6, 2, 2, w.light);
              r(x + 9, y + 1 + ((x / 12) % 2) * 6, 4, 1, w.light);
            }
          }
          K.specks(g, 8, [w.dark, w.light], 60 + v, 2);
        } else if (w.style === 'brick') {
          // Pierre blanchie à la chaux.
          for (let row = 0; row < 6; row++) {
            const y = 10 + row * 8,
              off = row % 2 ? 0 : 8;
            r(0, y, 48, 1, w.dark);
            for (let x = -off; x < 48; x += 16) {
              r(x, y, 1, 8, w.dark);
              r(x + 1, y + 1, 14, 1, w.light);
              if (hsh(x, row) > 0.75) {
                g.globalAlpha = 0.25;
                r(x + 2, y + 2, 13, 5, w.dark);
                g.globalAlpha = 1;
              }
            }
          }
        } else if (w.style === 'logs') {
          // Rondins empilés jusqu'au sol, nœuds et calfeutrage.
          for (let k = 0; k < 8; k++) {
            const y = 10 + k * 11;
            r(0, y, 48, 11, k % 2 ? w.face : w.dark);
            r(0, y, 48, 2, w.light);
            r(0, y + 10, 48, 1, I.edge.dark);
            if (hsh(k, 3) > 0.5) r(6 + hsh(3, k) * 32, y + 4, 5, 3, I.edge.dark);
          }
        } else if (w.style === 'leaf') {
          // Elfes : lambris de bois clair à arcs, lierre fleuri qui grimpe, feuilles d'or peintes.
          for (let x = 0; x < 48; x += 24) {
            g.globalAlpha = 0.5;
            r(x + 2, 14, 20, 40, w.dark);
            g.globalAlpha = 1;
            r(x + 4, 18, 16, 34, w.face);
            for (let k = 0; k < 8; k++)
              r(x + 12 + Math.round(Math.sin(k * 1.3) * 4), 20 + k * 2, 2, 2, w.light);
            r(x + 10, 13, 4, 3, w.gold);
          }
          for (let y = 12; y < 56; y += 3) {
            const vx = 46 + Math.round(Math.sin((y + v * 7) * 0.4) * 2);
            r(vx - 1, y, 2, 2, w.vine);
            if (y % 9 === 0) r(vx - 3, y, 2, 2, w.vine);
            if (y % 12 === 3) r(vx + 1, y - 1, 2, 2, w.gold);
          }
        } else if (w.style === 'rune') {
          // Nains : grands blocs de pierre taillée, joints profonds, frise de runes dorées.
          for (let row = 0; row < 4; row++) {
            const y = 10 + row * 12,
              off = row % 2 ? 0 : 12;
            r(0, y, 48, 2, w.dark);
            for (let x = -off; x < 48; x += 24) {
              r(x, y, 2, 12, w.dark);
              r(x + 2, y + 2, 21, 2, w.light);
              if (hsh(x, row) > 0.7) {
                g.globalAlpha = 0.3;
                r(x + 4, y + 5, 16, 6, w.dark);
                g.globalAlpha = 1;
              }
            }
          }
          r(0, 30, 48, 4, w.dark);
          for (let x = 2; x < 48; x += 8) {
            r(x, 31, 3, 1, w.gold);
            r(x + 1, 32, 1, 2, w.gold);
            r(x + 3, 32, 2, 1, w.gold);
          }
        } else {
          // Terre crue lissée, fissures, frise peinte.
          K.specks(g, 14, [w.dark, w.light], 40 + v, 2);
          for (let k = 0; k < 3; k++) {
            const x = 4 + hsh(k, 1) * 36,
              y = 14 + hsh(1, k) * 30;
            r(x, y, 5, 1, w.dark);
            r(x + 4, y + 1, 1, 4, w.dark);
          }
          r(0, 44, 48, 3, wd);
          for (let x = 0; x < 48; x += 8) {
            r(x + 2, 47, 4, 2, wl);
            r(x + 3, 49, 2, 2, wl);
          }
        }
        // Couronnement du mur.
        r(0, 0, 48, 10, w.top);
        r(0, 9, 48, 2, w.light);
        if (w.style !== 'logs') {
          // Cimaise, puis lambris à panneaux biseautés (ou carreaux de faïence en cuisine).
          r(0, 56, 48, 4, wd);
          r(0, 56, 48, 1, wl);
          r(0, 60, 48, 30, wa);
          if (I.faience)
            for (let ty = 0; ty < 3; ty++)
              for (let tx = 0; tx < 4; tx++) {
                const X = tx * 12,
                  Y = 60 + ty * 10;
                r(X, Y, 12, 10, '#e8eef4');
                r(X, Y, 12, 1, '#ffffff');
                r(X + 11, Y, 1, 10, '#a8b4c4');
                r(X + 4, Y + 3, 4, 4, (tx + ty) % 2 ? '#3a64a8' : '#5a8ac8');
              }
          else {
            r(4, 64, 40, 22, wl);
            r(5, 65, 39, 21, wa);
            r(43, 64, 1, 22, wd);
            r(4, 85, 40, 1, wd);
            r(8, 68, 32, 1, wd);
          }
        }
        // Plinthe et pied du mur dans l'ombre.
        r(0, 88, 48, 8, wd);
        r(0, 88, 48, 1, wl);
        g.globalAlpha = 0.45;
        r(0, 91, 48, 5, '#000000');
        g.globalAlpha = 1;
        return cv;
      });
    }
    // ---------------------------------------------------------------- Meubles : rendus comme les objets des donjons
    // Chaque meuble est peint à part : lumière à gauche, ombre à droite, contour sombre et ombre au sol.
    // Les meubles animés (feu, vapeur, horloge, fenêtres, plantes…) sont repeints toutes les deux images.
    const ANIM = new Set(
      Object.keys(CATALOG).filter(k => /time|fire\(|view\(/.test(String(CATALOG[k].draw)))
    );
    const SPRITES = new Map(),
      PADX = 24,
      PADT = 72,
      PADB = 16;
    function paintItem(g, cat, r, X, Y) {
      const d = houseDims(cat, r),
        W0 = cat.w * TS,
        H0 = cat.h * TS;
      if (cat.turn === 'self' || !r) cat.draw(g, X, Y, W0, H0, r);
      else if (cat.turn) {
        // Quart de tour autour du centre de sa place au sol.
        g.save();
        g.translate(X + (d.w * TS) / 2, Y + (d.h * TS) / 2);
        g.rotate((r * Math.PI) / 2);
        cat.draw(g, -W0 / 2, -H0 / 2, W0, H0, 0);
        g.restore();
      } else {
        // Miroir gauche-droite.
        g.save();
        g.translate(X * 2 + W0, 0);
        g.scale(-1, 1);
        cat.draw(g, X, Y, W0, H0, 0);
        g.restore();
      }
    }
    function itemSprite(it) {
      const cat = CATALOG[it.k],
        r = it.r || 0,
        d = houseDims(cat, r),
        w = d.w * TS,
        h = d.h * TS,
        frame = ANIM.has(it.k) ? Math.floor(time / 2) : 0,
        key = it.k + ':' + r;
      let e = SPRITES.get(key);
      if (e && e.frame === frame) return e;
      const W2 = w + PADX * 2,
        H2 = h + PADT + PADB;
      if (!e) {
        e = { a: CANAAN_TILE_KIT.canvas(W2, H2), b: CANAAN_TILE_KIT.canvas(W2, H2), frame: -1 };
        SPRITES.set(key, e);
      }
      const a = e.a.getContext('2d'),
        b = e.b.getContext('2d');
      a.clearRect(0, 0, W2, H2);
      a.imageSmoothingEnabled = false;
      paintItem(a, cat, r, PADX, PADT);
      if (cat.layer !== 'rug') {
        // Volume : reflet à gauche, ombre à droite, seulement sur les pixels de l'objet.
        a.globalCompositeOperation = 'source-atop';
        a.globalAlpha = 0.14;
        a.fillStyle = '#ffffff';
        a.fillRect(0, 0, PADX + Math.round(w * 0.2), H2);
        a.globalAlpha = 0.22;
        a.fillStyle = '#000000';
        a.fillRect(PADX + Math.round(w * 0.72), 0, W2, H2);
        a.globalAlpha = 1;
        a.globalCompositeOperation = 'source-over';
        // Silhouette sombre pour le contour.
        b.clearRect(0, 0, W2, H2);
        b.drawImage(e.a, 0, 0);
        b.globalCompositeOperation = 'source-in';
        b.fillStyle = OUT;
        b.fillRect(0, 0, W2, H2);
        b.globalCompositeOperation = 'source-over';
      }
      e.frame = frame;
      return e;
    }
    function drawItem(c, room, it, alpha = 1) {
      const cat = CATALOG[it.k],
        wall = houseOnWall(cat),
        r = it.r || 0,
        d = houseDims(cat, r),
        X = px(room, it.x),
        Y = py(room, wall ? 0 : it.y),
        w = d.w * TS,
        h = d.h * TS;
      let e = null;
      try {
        e = itemSprite(it);
      } catch {
        e = null;
      }
      c.globalAlpha = alpha;
      if (!e) paintItem(c, cat, r, X, Y);
      else {
        if (cat.layer === 'floor') {
          // Ombre au sol, comme sous les objets des donjons.
          c.globalAlpha = 0.3 * alpha;
          c.fillStyle = '#0a0806';
          c.beginPath();
          c.ellipse(X + w / 2, Y + h - 5, w / 2 - 3, 6, 0, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = alpha;
        }
        if (cat.layer !== 'rug')
          for (const [dx, dy] of [
            [-2, 0],
            [2, 0],
            [0, -2],
            [0, 2]
          ])
            c.drawImage(e.b, X - PADX + dx, Y - PADT + dy);
        c.drawImage(e.a, X - PADX, Y - PADT);
      }
      c.globalAlpha = 1;
      if (alpha === 1 && (cat.light || cat.fire))
        canaanLight(
          X + w / 2,
          Y + (wall ? 50 : 10),
          cat.fire ? 130 : cat.light === '#e8f4ff' ? 110 : 120,
          cat.fire ? '#ffa850' : cat.light
        );
    }
    function drawRoom(c) {
      const room = current();
      if (!room) return;
      const list = itemsOf(room);
      c.save();
      c.imageSmoothingEnabled = false;
      for (const layer of ['rug', 'wall', 'curtain', 'floor'])
        for (const it of list) if (CATALOG[it.k].layer === layer) drawItem(c, room, it);
      const d = insideDoor(room);
      if (Math.hypot(P.x - d.x, P.y - d.y) < 90) drawCanaanPrompt(c, '[E] Sortir', d.x, d.y + 30);
      c.restore();
    }
    // Noms des lieux : même facture que les invitations [E] (sprite-kit.js).
    const label = (c, text, x, y, col) => drawCanaanName(c, text, x, y, col);

    // Façades et architectures (scripts/house/facades.js).
    const {
      OUT,
      LOOKS,
      visible,
      rnd,
      light,
      smoke,
      windowLife,
      flag,
      laundry,
      leaves,
      campfire,
      ripple,
      spark,
      halo,
      drawStilts,
      signAt,
      groundAt,
      paintForm
    } = CANAAN_HOUSE_FACADES.create({
      state: LIVE,
      R
    });
    // Effets animés d'un bâtiment (lueurs, fumée, clapotis) : notés pendant la peinture de son image gardée (FX),
    // puis rejoués à chaque image par-dessus.
    let FX = null;
    // ---------------------------------------------------------------- Abords
    // Petits objets autour de chaque bâtiment, accordés à son modèle et à son biome (vrai : ils remplacent les abords
    // génériques). Le contour sombre et la lumière d'en haut à gauche suivent le style des décors.
    const PROP = {
      barrel(c, x, y) {
        R(c, x - 1, y - 23, 20, 24, OUT);
        R(c, x, y - 22, 18, 22, '#8a5a34');
        R(c, x, y - 18, 18, 2, '#4a4a52');
        R(c, x, y - 7, 18, 2, '#4a4a52');
        R(c, x + 3, y - 22, 3, 22, '#a8743e');
        R(c, x + 13, y - 22, 3, 22, '#6a4226');
      },
      jar(c, x, y, h = 16, col = '#c8783a') {
        R(c, x - 1, y - h - 1, 12, h + 2, OUT);
        R(c, x, y - h, 10, h, col);
        R(c, x + 2, y - h - 4, 6, 5, OUT);
        R(c, x + 3, y - h - 3, 4, 3, col);
        R(c, x + 2, y - h + 3, 2, h - 6, '#ffffff44');
      },
      lantern(c, x, y) {
        R(c, x - 2, y - 40, 4, 40, OUT);
        R(c, x - 1, y - 40, 2, 40, '#4a3020');
        R(c, x - 5, y - 50, 10, 12, OUT);
        R(c, x - 4, y - 49, 8, 10, '#ffcf6a');
        R(c, x - 3, y - 48, 6, 3, '#fff2b0');
        halo(c, x, y - 44, 22);
        light(x, y - 44, 70, '#ffcf6a');
      },
      fence(c, x0, x1, y, col = '#e8dcc0') {
        R(c, x0 - 1, y - 15, x1 - x0 + 2, 4, OUT);
        R(c, x0, y - 14, x1 - x0, 2, col);
        R(c, x0, y - 7, x1 - x0, 2, col);
        for (let x = x0; x <= x1 - 4; x += 9) {
          R(c, x - 1, y - 21, 6, 22, OUT);
          R(c, x, y - 20, 4, 20, col);
          R(c, x, y - 20, 4, 2, '#ffffff');
        }
      },
      bed(c, x, y, w, cols) {
        R(c, x - 1, y - 9, w + 2, 10, OUT);
        R(c, x, y - 8, w, 8, '#5a3e24');
        for (let k = 0; k < w - 4; k += 6) {
          R(c, x + 2 + k, y - 12 - (k % 12 ? 0 : 2), 4, 4, '#4f8a42');
          R(c, x + 3 + k, y - 13 - (k % 12 ? 0 : 2), 2, 2, cols[(k / 6) % cols.length]);
        }
      },
      bale(c, x, y) {
        R(c, x - 1, y - 17, 26, 18, OUT);
        R(c, x, y - 16, 24, 16, '#d8b45a');
        for (let k = 0; k < 24; k += 3) R(c, x + k, y - 16, 1, 16, '#b8943e');
        R(c, x, y - 16, 24, 3, '#efd27a');
        R(c, x + 7, y - 16, 2, 16, '#8a6a2a');
        R(c, x + 16, y - 16, 2, 16, '#8a6a2a');
      },
      pumpkin(c, x, y) {
        R(c, x - 1, y - 11, 16, 12, OUT);
        R(c, x, y - 10, 14, 10, '#e07a28');
        R(c, x + 4, y - 10, 1, 10, '#b05a1a');
        R(c, x + 9, y - 10, 1, 10, '#b05a1a');
        R(c, x + 6, y - 14, 3, 4, '#4e6a2a');
      },
      mushroom(c, x, y, col, glow) {
        R(c, x + 3, y - 8, 4, 8, '#efe4c8');
        R(c, x - 1, y - 13, 12, 7, OUT);
        R(c, x, y - 12, 10, 5, col);
        R(c, x + 2, y - 12, 2, 2, '#ffffff');
        if (glow) {
          halo(c, x + 5, y - 9, 16, '190,140,255');
          if (FX) FX.push([8, x + 5, y - 9, 34, col, x]);
        }
      },
      stump(c, x, y) {
        R(c, x - 1, y - 15, 24, 16, OUT);
        R(c, x, y - 14, 22, 14, '#6a4a2a');
        R(c, x, y - 14, 22, 4, '#c8a070');
        R(c, x + 5, y - 13, 12, 2, '#a07a50');
        // Hache plantée.
        R(c, x + 12, y - 30, 3, 18, '#7a5230');
        R(c, x + 8, y - 30, 9, 6, '#9a9aa0');
        R(c, x + 8, y - 30, 9, 2, '#d4d4dc');
      },
      sacks(c, x, y) {
        for (const [dx, dy] of [
          [0, 0],
          [14, 0],
          [7, -12]
        ]) {
          R(c, x + dx - 1, y + dy - 15, 16, 16, OUT);
          R(c, x + dx, y + dy - 14, 14, 14, '#c8a878');
          R(c, x + dx + 4, y + dy - 16, 6, 3, '#a8885a');
          R(c, x + dx + 2, y + dy - 12, 3, 8, '#e0c898');
        }
      },
      well(c, x, y) {
        R(c, x - 1, y - 21, 38, 22, OUT);
        for (let k = 0; k < 36; k += 9) R(c, x + k, y - 20, 8, 20, k % 18 ? '#8e8a84' : '#a4a09a');
        R(c, x, y - 20, 36, 3, '#c4c4ca');
        R(c, x + 3, y - 52, 3, 32, '#5e3c22');
        R(c, x + 30, y - 52, 3, 32, '#5e3c22');
        R(c, x - 3, y - 60, 42, 10, OUT);
        R(c, x - 2, y - 59, 40, 8, '#9e402e');
        R(c, x - 2, y - 59, 40, 2, '#de6c4e');
        R(c, x + 16, y - 50, 2, 18, '#d8d0c0');
        R(c, x + 12, y - 34, 10, 8, '#7a5230');
      },
      net(c, x, y) {
        R(c, x, y - 40, 3, 40, '#5e4630');
        R(c, x + 36, y - 40, 3, 40, '#5e4630');
        for (let k = 0; k < 36; k += 4) {
          R(c, x + 3 + k, y - 38, 1, 26 + Math.round(Math.sin(k * 0.3) * 3), '#c8c0a0');
        }
        for (let k = 0; k < 26; k += 5) R(c, x + 3, y - 38 + k, 33, 1, '#c8c0a0');
        R(c, x + 10, y - 20, 5, 4, '#e8a040');
      },
      boat(c, x, y) {
        R(c, x - 1, y - 11, 46, 12, OUT);
        R(c, x, y - 10, 44, 10, '#7a5638');
        R(c, x + 4, y - 10, 36, 3, '#a87444');
        R(c, x, y - 4, 44, 2, '#5a3e24');
        R(c, x + 18, y - 14, 3, 6, '#5a3e24');
      },
      rug(c, x, y, w) {
        R(c, x - 1, y - 1, w + 2, 10, OUT);
        R(c, x, y, w, 8, '#a8343a');
        R(c, x + 3, y + 2, w - 6, 4, '#d8a040');
      },
      palm(c, x, y) {
        for (let k = 0; k < 40; k += 4)
          R(c, x + Math.round(Math.sin(k * 0.05) * 4) - 3, y - k - 4, 6, 4, k % 8 ? '#8a6a3a' : '#a8844a');
        for (const [dx, dy, w] of [
          [-22, -46, 24],
          [2, -48, 24],
          [-14, -54, 28],
          [-6, -42, 12]
        ]) {
          R(c, x + dx - 1, y + dy - 1, w + 2, 7, OUT);
          R(c, x + dx, y + dy, w, 5, '#3e7a34');
          R(c, x + dx, y + dy, w, 2, '#5a9a44');
        }
      },
      firepit(c, x, y) {
        for (let k = 0; k < 6; k++) R(c, x - 14 + k * 5, y - 4, 5, 5, k % 2 ? '#7e786a' : '#9c9686');
        R(c, x - 8, y - 7, 16, 3, '#5e3c22');
        if (FX) FX.push([10, x, y - 4]);
      }
    };
    function surroundings(c, b, L, g) {
      const { X, Wd, base, mid } = g,
        id = b.room?.id,
        y = base + 2;
      switch (id) {
        case 'maison':
          PROP.fence(c, X - 60, X - 6, y);
          PROP.fence(c, X + Wd + 6, X + Wd + 60, y);
          PROP.bed(c, X - 54, y - 26, 40, ['#e05a7a', '#f0c040', '#ffffff']);
          R(c, X + Wd + 50, base - 70, 3, 52, '#5e3c22');
          R(c, X + Wd + 14, base - 70, 3, 52, '#5e3c22');
          if (FX) FX.push([6, X + Wd + 15, X + Wd + 51, base - 66]);
          return true;
        case 'marmite':
          PROP.lantern(c, X - 40, y);
          PROP.barrel(c, X + Wd + 8, y);
          PROP.barrel(c, X + Wd + 28, y - 4);
          return true;
        case 'echoppe':
          PROP.sacks(c, X - 52, y);
          PROP.barrel(c, X + Wd + 30, y);
          R(c, X + Wd + 31, base - 26, 16, 6, '#c83a2a');
          return false;
        case 'aubepines':
          PROP.fence(c, X - 62, X - 8, y, '#f0e6d0');
          PROP.bed(c, X - 56, y - 26, 42, ['#e85a7a', '#ffffff', '#e85a7a']);
          PROP.lantern(c, X + Wd + 22, y);
          return true;
        case 'puits':
          PROP.well(c, X + Wd + 8, y);
          PROP.bed(c, X - 48, y, 40, ['#9a7ae0', '#ffffff']);
          return true;
        case 'chene':
          for (const [dx, col] of [
            [-50, '#c83a2a'],
            [-34, '#e85a7a'],
            [Wd + 14, '#c83a2a'],
            [Wd + 30, '#f0c040']
          ])
            PROP.mushroom(c, X + dx, y - 6, col, false);
          PROP.lantern(c, X - 18, y);
          if (FX) FX.push([7, X - 40, b.y * TS - 120, Wd + 80, 200, ['#5a9a44', '#8ac860', '#e0c040'], b.x]);
          return true;
        case 'clairieres':
          PROP.stump(c, X - 54, y);
          PROP.lantern(c, X - 16, y);
          return false;
        case 'oasis':
          PROP.palm(c, X - 36, y);
          PROP.jar(c, X + Wd + 8, y);
          PROP.jar(c, X + Wd + 22, y, 12, '#a8602c');
          PROP.rug(c, mid - 30, base + 4, 60);
          return true;
        case 'dunes':
          PROP.firepit(c, X - 44, y);
          PROP.jar(c, X + Wd + 14, y);
          PROP.sacks(c, X + Wd + 30, y);
          if (FX) FX.push([9, mid + 1, b.y * TS - 118, '#b8423a', 18]);
          return true;
        case 'pilotis':
          PROP.net(c, X - 66, y);
          PROP.boat(c, X + Wd + 10, y + 6);
          PROP.lantern(c, X + Wd + 4, y - 8);
          return true;
        case 'rousses':
          PROP.bale(c, X - 56, y);
          PROP.bale(c, X - 44, y - 14);
          PROP.pumpkin(c, X + Wd + 8, y);
          PROP.pumpkin(c, X + Wd + 26, y + 2);
          if (FX) FX.push([7, X - 50, b.y * TS - 90, Wd + 100, 170, ['#e8a040', '#c84a2a', '#f0c040'], b.x]);
          return true;
        case 'cristaux':
          for (const [dx, col] of [
            [-56, '#c89aff'],
            [-40, '#9af0ff'],
            [Wd + 30, '#ff9af0'],
            [Wd + 46, '#c89aff']
          ])
            PROP.mushroom(c, X + dx, y - 4, col, true);
          return true;
      }
      return false;
    }
    // Peinture complète (sans les effets animés ni les noms), dans l'image gardée du bâtiment.
    function paintBuilding(c, b) {
      const L = LOOKS[b.style] || LOOKS.chaume,
        X = b.x * TS,
        Y = b.y * TS,
        Wd = b.w * TS,
        Hd = b.h * TS,
        base = Y + Hd,
        mid = X + Wd / 2,
        seed = b.x * 31 + b.y,
        lift = L.stilts ? 16 : 0,
        bot = base - 6 - lift,
        top = bot - 66;
      // Ombre au sol : ovale en dégradé radial, décalée vers le bas et la droite (lumière en haut à gauche).
      if (c.createRadialGradient) {
        c.save();
        c.translate(mid + 10, base - 2);
        c.scale(1, 0.26);
        const sh = c.createRadialGradient(0, 0, Wd * 0.2, 0, 0, Wd * 0.68);
        sh.addColorStop(0, 'rgba(8,10,14,.42)');
        sh.addColorStop(1, 'rgba(8,10,14,0)');
        c.fillStyle = sh;
        c.fillRect(-Wd, -Wd, Wd * 2, Wd * 2);
        c.restore();
      } else {
        c.globalAlpha = 0.28;
        R(c, X, base - 8, Wd + 14, 12, '#0a0e12');
        c.globalAlpha = 1;
      }
      if (L.stilts && b.form === 'round') drawStilts(c, L, X + 20, Wd - 40, bot, lift, mid);
      const roofTop = paintForm(c, b, L, { X, Wd, bot, mid, seed, base });
      // Enseigne en potence, à l'angle gauche de la façade.
      if (b.sign) {
        R(c, X - 22, top + 2, 28, 3, '#3a2a1e');
        if (FX) FX.push([5, X - 22, top + 2, b.sign]);
        else signAt(c, X - 22, top + 2, b.sign);
      }
      // Abords propres à chaque bâtiment.
      const decorated = surroundings(c, b, L, { X, Wd, base, mid, seed });
      // Détails propres à chaque lieu.
      if (L.crates)
        for (const [dx, dy] of [
          [Wd - 4, 0],
          [Wd + 14, 6]
        ]) {
          R(c, X + dx - 1, base - 31 + dy, 24, 24, OUT);
          R(c, X + dx, base - 30 + dy, 22, 22, '#a07444');
          R(c, X + dx, base - 30 + dy, 22, 3, '#c8945a');
          R(c, X + dx + 2, base - 30 + dy, 2, 22, '#7a5230');
          R(c, X + dx + 18, base - 30 + dy, 2, 22, '#7a5230');
          R(c, X + dx + 4, base - 36 + dy, 8, 6, '#d84a3a');
          R(c, X + dx + 12, base - 35 + dy, 6, 5, '#e8c040');
        }
      if (L.barrels)
        for (const dx of [-26, -4]) {
          R(c, X + dx - 1, base - 33, 24, 30, OUT);
          R(c, X + dx, base - 32, 22, 28, '#8a5a34');
          R(c, X + dx, base - 28, 22, 3, '#4a4a52');
          R(c, X + dx, base - 14, 22, 3, '#4a4a52');
          R(c, X + dx + 4, base - 32, 4, 28, '#a8743e');
          R(c, X + dx + 16, base - 32, 4, 28, '#6a4226');
        }
      if (L.wood)
        for (let k = 0; k < 3; k++)
          for (let j = 0; j < 3 - k; j++) {
            R(c, X + Wd + j * 10 + k * 5 - 1, base - 13 - k * 9, 11, 10, OUT);
            R(c, X + Wd + j * 10 + k * 5, base - 12 - k * 9, 9, 8, '#7a5638');
            R(c, X + Wd + j * 10 + k * 5 + 2, base - 10 - k * 9, 5, 4, '#c8a070');
          }
      if (!decorated && !L.crates && !L.barrels && !L.wood) groundAt(c, L, X, Wd, base, seed);
      return roofTop;
    }
    // ---------------------------------------------------------------- Matières et finition
    // Codes des matières (canal rouge de l'image jumelle).
    const M = {
      none: 0,
      plaster: 1,
      stone: 2,
      wood: 3,
      logs: 4,
      thatch: 5,
      tiles: 6,
      slate: 7,
      shingles: 8,
      glass: 9,
      metal: 10,
      leaves: 11,
      cloth: 12,
      crystal: 13,
      adobe: 14,
      bark: 15,
      reeds: 16,
      plain: 17,
      cap: 18
    };
    // Relief de chaque matière : hauteur du biseau des blocs et force du grain en relief.
    const BEVEL = [0, 0.4, 1.4, 1, 1.3, 0.6, 1.1, 1.1, 1, 0.3, 0.6, 0.9, 0.3, 1.2, 0.5, 1.1, 0.6, 0.4, 0.5];
    const BUMP = [
      0, 0.25, 0.6, 0.45, 0.5, 0.9, 0.35, 0.3, 0.45, 0, 0.2, 0.8, 0.3, 0, 0.35, 0.9, 0.9, 0.15, 0.2
    ];
    // Couleur → matière, pour un bâtiment donné (murs, poutres, toit selon son allure ; détails communs).
    function matsFor(b, L) {
      const map = new Map(),
        put = (cols, m) => cols.forEach(c => map.set(c, m)),
        wall =
          { timber: M.plaster, stone: M.stone, logs: M.logs, planks: M.wood, adobe: M.adobe }[L.wall] ??
          M.plaster,
        roof =
          {
            thatch: M.thatch,
            reeds: M.reeds,
            tiles: M.tiles,
            slate: M.slate,
            shingles: M.shingles,
            flat: M.adobe
          }[L.roof] ?? M.shingles;
      put(
        [
          '#9a9aa0',
          '#c4c4ca',
          '#8e8a84',
          '#76726c',
          '#a4a09a',
          '#b89a70',
          '#a2865e',
          '#c8aa80',
          '#8a84a4',
          '#746e90',
          '#9e98b8',
          '#b4ae9e',
          '#9c9686',
          '#7e786a',
          '#d8b47e',
          '#c49e6a',
          '#a8844f',
          '#a49cc0',
          '#8c84aa',
          '#6e668e',
          '#9a5a44',
          '#6a3a2c',
          '#8a8680',
          '#64605a',
          '#5a5a62'
        ],
        M.stone
      );
      put(
        [
          '#8a5a34',
          '#a87444',
          '#5e3c22',
          '#7a5230',
          '#b08250',
          '#a07444',
          '#c8945a',
          '#8a5a34',
          '#a8743e',
          '#6a4226',
          '#7a5638',
          '#c8a070',
          '#6a4a2a',
          '#3a2a1e',
          '#4a3020',
          '#7a6446',
          '#c8a878'
        ],
        M.wood
      );
      put(['#ffd890', '#fff0c0', '#f0c070'], M.glass);
      put(['#3a3a40', '#e0c060', '#4a4a52', '#c9a24a', '#f0d070', '#fff2a0'], M.metal);
      put(['#7a5434', '#5e3e24', '#3e2a18', '#664428', '#2e1e10'], M.bark);
      put(
        [
          '#5a9a44',
          '#3e7a34',
          '#2a5426',
          '#8ac860',
          '#e08a3a',
          '#c0602a',
          '#8a4020',
          '#4f8a42',
          '#6aa852',
          '#4e7434',
          '#6e9a48'
        ],
        M.leaves
      );
      put(['#e8dcc0', '#b8423a', '#3a6a9a', '#a8343a', '#d8a040'], M.cloth);
      put(['#9af0ff', '#c89aff', '#ffb0f0', '#9ae0ff', '#e0f8ff'], M.crystal);
      put(['#f4ecda', '#d6c6a4', '#f6eedc', '#d8c8a8', '#fff2d8'], M.adobe);
      put(L.face, wall);
      put(L.beam, M.wood);
      put(L.tones, b.form === 'mushroom' ? M.cap : roof);
      if (b.form === 'tent') put(['#e8dcc0', '#b8423a', '#3a6a9a'], M.cloth);
      return map;
    }
    // Finition, au niveau des routes : une carte de reliefs est tirée des matières (biseau de chaque bloc : pierre,
    // planche, tuile, rondin ; grain en relief : chaume, écorce, feuillage), éclairée en haut à gauche ; puis chaque
    // matière reçoit sa texture (veinage du bois, mèches du chaume, piqûres de la pierre, reflets du verre, trame de la
    // toile, facettes des cristaux), l'usure du biome (mousse en forêt, au marais et en forêt enchantée ; poussière au
    // désert ; humidité au pied des murs), la lumière d'ensemble (plus claire à gauche) et un grain fin.
    function finish(cv, mat, x0, wd, groundY, zone) {
      const g = cv.getContext('2d');
      let img, mimg;
      try {
        img = g.getImageData(0, 0, cv.width, cv.height);
        mimg = mat ? mat.getContext('2d').getImageData(0, 0, cv.width, cv.height) : null;
      } catch (e) {
        return;
      }
      const d = img?.data,
        md = mimg?.data,
        W2 = cv.width,
        H2 = cv.height;
      if (!d || d.length !== W2 * H2 * 4) return;
      const n = W2 * H2,
        code = new Uint8Array(n),
        id = new Uint8Array(n),
        height = new Float32Array(n);
      if (md && md.length === d.length)
        for (let i = 0; i < n; i++) {
          code[i] = md[i * 4 + 3] > 200 ? md[i * 4] : 0;
          id[i] = md[i * 4 + 1];
        }
      const hsh = (x, y, k) => {
        let h = (x * 374761393 + y * 668265263 + k * 1442695041) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
      };
      const vn = (x, y, k) => {
        const xi = Math.floor(x),
          yi = Math.floor(y),
          u = x - xi,
          v = y - yi,
          a = hsh(xi, yi, k),
          b2 = hsh(xi + 1, yi, k),
          c2 = hsh(xi, yi + 1, k),
          e = hsh(xi + 1, yi + 1, k);
        return (
          a + (b2 - a) * u * u * (3 - 2 * u) + (c2 - a) * v * v * (3 - 2 * v) + (a - b2 - c2 + e) * u * v
        );
      };
      const mossy = zone === 1 || zone === 2 || zone === 5,
        dusty = zone === 4;
      // 1. Carte de reliefs : distance au bord du bloc (jusqu'à 3 px) pour le biseau, plus le grain de la matière.
      const runH = new Uint8Array(n),
        runV = new Uint8Array(n);
      for (let y = 0; y < H2; y++)
        for (let x = 0; x < W2; x++) {
          const i = y * W2 + x,
            m = code[i];
          if (!m || d[i * 4 + 3] < 200) continue;
          const me = id[i],
            same = (u, v) =>
              u >= 0 && v >= 0 && u < W2 && v < H2 && id[v * W2 + u] === me && code[v * W2 + u] === m;
          let dist = 3,
            h = 0,
            v = 0;
          for (let k = 1; k <= 3 && dist === 3; k++)
            if (!same(x - k, y) || !same(x + k, y) || !same(x, y - k) || !same(x, y + k)) dist = k - 1;
          for (let k = 1; k <= 8; k++) {
            if (same(x - k, y)) h++;
            if (same(x + k, y)) h++;
            if (same(x, y - k)) v++;
            if (same(x, y + k)) v++;
          }
          runH[i] = h;
          runV[i] = v;
          let bump = 0;
          if (m === M.thatch || m === M.reeds) bump = hsh(x, y >> 2, 3) * 0.7 + hsh(x >> 1, y, 4) * 0.3;
          else if (m === M.bark) bump = hsh(x >> 1, (y / 6) | 0, 5);
          else if (m === M.leaves) bump = vn(x / 3, y / 3, 6);
          else if (m === M.wood || m === M.logs)
            bump = h >= v ? vn(x / 9, y / 1.5, 7) : vn(x / 1.5, y / 9, 7);
          else bump = vn(x / 2.5, y / 2.5, 8);
          height[i] = (Math.min(dist, 3) / 3) * BEVEL[m] + bump * BUMP[m];
        }
      // 2. Lumière, textures et usure.
      for (let y = 0; y < H2; y++)
        for (let x = 0; x < W2; x++) {
          const i = y * W2 + x,
            k = i * 4;
          if (d[k + 3] < 200) continue;
          const m = code[i],
            t = Math.min(1, Math.max(0, (x - x0) / wd));
          let f = 1.06 - 0.13 * t + (hsh(x >> 1, y >> 1, 9) - 0.5) * 0.05,
            tint = null,
            tintK = 0;
          if (m) {
            const hl = x > 0 ? height[i - 1] : height[i],
              hr = x < W2 - 1 ? height[i + 1] : height[i],
              hu = y > 0 ? height[i - W2] : height[i],
              hd = y < H2 - 1 ? height[i + W2] : height[i];
            // Pente de la carte de reliefs, éclairée depuis le haut à gauche.
            f += ((hr - hl) * -0.6 + (hd - hu) * -0.8) * 0.32;
            const me = id[i],
              wet = Math.max(0, 1 - (groundY - y) / 26);
            switch (m) {
              case M.stone:
                f *= 0.93 + hsh(me, 1, 11) * 0.14;
                if (hsh(x, y, 12) > 0.975) f *= 0.72;
                if (mossy && vn(x / 7, y / 7, 13) > 0.62 && (y > groundY - 30 || hsh(me, 2, 14) > 0.7))
                  ((tint = [78, 120, 54]), (tintK = 0.45));
                break;
              case M.plaster:
              case M.adobe:
                f *= 1 + (hsh(x, y, 15) - 0.5) * 0.06 - vn(x / 18, y / 10, 16) * 0.06;
                if (hsh(x >> 2, y >> 2, 17) > 0.992) f *= 0.8;
                break;
              case M.wood:
              case M.logs:
                f *=
                  1 +
                  Math.sin(
                    (runH[i] >= runV[i] ? y * 1.7 + vn(x / 10, y, 18) * 5 : x * 1.7 + vn(x, y / 10, 18) * 5) +
                      me
                  ) *
                    0.06;
                if (hsh(x >> 1, y >> 1, 19) > 0.985) f *= 0.75;
                if (mossy && wet > 0 && vn(x / 6, y / 4, 20) > 0.58)
                  ((tint = [70, 100, 48]), (tintK = 0.35 * wet));
                break;
              case M.thatch:
              case M.reeds:
                f *= 0.9 + hsh(x, (y / 3) | 0, 21) * 0.22;
                break;
              case M.tiles:
              case M.slate:
              case M.shingles:
                f *= 0.92 + hsh(me, 3, 22) * 0.16;
                if (mossy && vn(x / 5, y / 5, 23) > 0.66) ((tint = [84, 118, 60]), (tintK = 0.4));
                else if (vn(x / 4, y / 4, 24) > 0.78) ((tint = [196, 190, 150]), (tintK = 0.25));
                break;
              case M.glass:
                if ((x + y) % 16 < 3) f *= 1.22;
                f *= 1.05 - Math.min(0.12, ((y % 24) / 24) * 0.12);
                break;
              case M.cloth:
                f *= ((x + y) & 1 ? 1.03 : 0.97) * (1 + Math.sin(x * 0.18) * 0.05);
                break;
              case M.crystal:
                f *= (x + y) % 6 < 3 ? 1.14 : 0.94;
                break;
              case M.bark:
                if (hsh(x >> 1, 0, 25) > 0.78) f *= 0.8;
                break;
              case M.leaves:
                if (vn(x / 2, y / 2, 26) > 0.7) f *= 1.15;
                break;
              case M.cap:
                f *= 1 + (vn(x / 12, y / 12, 27) - 0.5) * 0.12;
                break;
            }
            // Humidité au pied des murs ; poussière claire au désert.
            if (wet > 0 && m !== M.glass && m !== M.crystal) {
              if (dusty) ((tint = tint || [226, 200, 150]), (tintK = Math.max(tintK, 0.3 * wet)));
              else f *= 1 - 0.14 * wet;
            }
          } else if (y > groundY - 14) f *= 0.84 + 0.16 * Math.max(0, (groundY - y) / 14);
          let r = d[k] * f,
            gg = d[k + 1] * f,
            bb = d[k + 2] * f * 0.985;
          if (tint) {
            r += (tint[0] * f - r) * tintK;
            gg += (tint[1] * f - gg) * tintK;
            bb += (tint[2] * f - bb) * tintK;
          }
          d[k] = Math.min(255, r);
          d[k + 1] = Math.min(255, gg);
          d[k + 2] = Math.min(255, bb);
        }
      g.putImageData(img, 0, 0);
    }
    // Image gardée de chaque bâtiment (et ses effets animés) : peinte une fois, posée d'un seul coup à chaque image.
    const BUILT = new WeakMap();
    function builtOf(b) {
      let s = BUILT.get(b);
      if (s !== undefined) return s;
      // Modèle en pixel art (building-art.js) : image à la taille des pixels d'art, agrandie sans flou à l'affichage.
      if (CANAAN_BUILDING_ART.has(b.room?.id)) {
        const art = CANAAN_BUILDING_ART.paint(b, b.x * TS, (b.y + b.h) * TS, b.w * TS);
        if (art) {
          s = {
            cv: art.canvas,
            x0: art.x0,
            y0: art.y0,
            w: art.canvas.width * art.scale,
            h: art.canvas.height * art.scale,
            fx: art.fx,
            roofTop: art.roofTop,
            art: true
          };
          BUILT.set(b, s);
          return s;
        }
      }
      const x0 = b.x * TS - 70,
        y0 = b.y * TS - 210,
        w = b.w * TS + 140,
        h = b.h * TS + 250,
        cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const g = cv.getContext?.('2d');
      if (!g?.translate) {
        BUILT.set(b, null);
        return null;
      }
      g.imageSmoothingEnabled = false;
      g.translate(-x0, -y0);
      // Image jumelle des matières, à la même place.
      const mat = document.createElement('canvas');
      mat.width = w;
      mat.height = h;
      const mg = mat.getContext('2d');
      if (mg?.translate) mg.translate(-x0, -y0);
      const L = LOOKS[b.style] || LOOKS.chaume;
      MAT = mg?.fillRect ? { g, m: mg, map: matsFor(b, L), def: M.plain, id: 0 } : null;
      FX = [];
      let roofTop;
      try {
        roofTop = paintBuilding(g, b);
      } finally {
        s = { cv, x0, y0, fx: FX, roofTop };
        FX = null;
        MAT = null;
      }
      finish(
        cv,
        mg ? mat : null,
        70,
        b.w * TS,
        (b.y + b.h) * TS - y0 - 6,
        Math.max(0, ZONES.indexOf(regionAt(b.x + 2, b.y + 1)))
      );
      BUILT.set(b, s);
      return s;
    }
    // Enseigne de la Maison de la Guilde : planche de bois cerclée d'or au-dessus de la porte, entre les colonnes du
    // porche, « GUILDE » en lettres dorées (traduit).
    function guildPlaque(c, mid, base) {
      const w = 70,
        h = 17,
        x = Math.round(mid - w / 2),
        y = Math.round(base - 73);
      c.fillStyle = OUT;
      c.fillRect(x - 2, y - 2, w + 4, h + 4);
      c.fillStyle = '#d8b040';
      c.fillRect(x, y, w, h);
      c.fillStyle = '#6a4428';
      c.fillRect(x + 2, y + 2, w - 4, h - 4);
      c.fillStyle = '#8a5a34';
      c.fillRect(x + 2, y + 2, w - 4, 3);
      c.fillStyle = '#f6dc78';
      for (const sx of [x + 6, x + w - 9]) c.fillRect(sx, y + 6, 3, 5);
      c.font = canaanFont(11);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = OUT;
      c.fillText(tt('GUILDE'), mid + 1, y + h / 2 + 2);
      c.fillStyle = '#ffe28a';
      c.fillText(tt('GUILDE'), mid, y + h / 2 + 1);
    }
    function drawBuilding(c, b) {
      const X = b.x * TS,
        Y = b.y * TS,
        Wd = b.w * TS,
        Hd = b.h * TS,
        base = Y + Hd,
        mid = X + Wd / 2;
      if (!visible(mid, Y + Hd / 2, 340)) return;
      c.save();
      c.imageSmoothingEnabled = false;
      const s = builtOf(b);
      let roofTop;
      if (s) {
        if (s.art) {
          // Ombre douce au sol, décalée vers le bas à droite.
          c.globalAlpha = 0.22;
          c.fillStyle = '#0a0e12';
          c.beginPath();
          c.ellipse(mid + 8, base - 2, Wd * 0.56, 16, 0, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          c.drawImage(s.cv, s.x0, s.y0, s.w, s.h);
        } else c.drawImage(s.cv, s.x0, s.y0);
        for (const e of s.fx) {
          if (e[0] === 0) canaanLight(e[1], e[2], e[3] * (0.94 + 0.06 * Math.sin(time * 0.23 + e[1])), e[4]);
          else if (e[0] === 1) smoke(c, e[1], e[2]);
          else if (e[0] === 2) ripple(c, e[1], e[2], e[3]);
          else if (e[0] === 3) spark(c, e[1], e[2], e[3], e[4]);
          else if (e[0] === 4) windowLife(c, e[1], e[2], e[3], e[4], e[5]);
          else if (e[0] === 5) {
            // Enseigne qui se balance au bout de sa potence.
            c.save();
            c.translate(e[1] + 10, e[2]);
            c.rotate(Math.sin(time * 0.05 + e[1]) * 0.09);
            c.translate(-e[1] - 10, -e[2]);
            signAt(c, e[1], e[2], e[3]);
            c.restore();
          } else if (e[0] === 6) laundry(c, e[1], e[2], e[3]);
          else if (e[0] === 7) leaves(c, e[1], e[2], e[3], e[4], e[5], e[6]);
          else if (e[0] === 8)
            canaanLight(e[1], e[2], e[3] * (0.75 + 0.25 * Math.sin(time * 0.06 + e[5])), e[4]);
          else if (e[0] === 9) flag(c, e[1], e[2], e[3], e[4]);
          else if (e[0] === 10) campfire(c, e[1], e[2]);
        }
        roofTop = s.roofTop;
        if (b.room?.id === 'guilde') guildPlaque(c, mid, base);
      } else roofTop = paintBuilding(c, b);
      // Nom du lieu (de près pour les demeures) et invitation à entrer (pas pour les maisons fermées des hameaux).
      const near = Math.hypot(P.x - mid, P.y - base) < 320;
      if (!b.closed && (b.place || b.sign || near))
        label(c, b.place ? b.place.name : b.label, mid, roofTop - 8);
      c.restore();
    }
    function draw(c) {
      if (game.world.instance) return;
      if (!current()) {
        if (game.world.layer !== 'under') for (const b of scene.buildings()) drawBuilding(c, b);
      }
      drawRoom(c);
    }
    // Invitations à entrer, dessinées après tous les bâtiments (cité elfique comprise) et l'occlusion (game-core.js),
    // pour qu'aucune façade ne passe par-dessus le texte.
    function drawPrompts(c) {
      if (game.world.instance || current()) return;
      c.save();
      if (game.world.layer !== 'under')
        for (const b of scene.buildings()) {
          if (b.closed) continue;
          const d = outsideDoor(b);
          if (Math.hypot(P.x - d.x, P.y - d.y) >= 90) continue;
          const base = (b.y + b.h) * TS;
          drawCanaanPrompt(c, '[E] Entrer', d.x, builtOf(b)?.art ? base - 52 : base - 86);
        }
      // Bâtiments des autres modules : seulement l'invitation à entrer, devant la porte.
      for (const b of externals()) {
        if (!!b.under !== (game.world.layer === 'under')) continue;
        const d = outsideDoor(b);
        if (Math.hypot(P.x - d.x, P.y - d.y) < 90)
          drawCanaanPrompt(c, '[E] Entrer · ' + b.label, d.x, d.y - 40);
      }
      c.restore();
    }
    // Bâtiments à redessiner devant les personnages qui passent derrière (world-look.js).
    function occluders() {
      if (game.world.instance || current()) return [];
      const out = [];
      for (const b of scene.buildings()) {
        const s = BUILT.get(b);
        if (!s || !visible((b.x + b.w / 2) * TS, (b.y + b.h / 2) * TS, 340)) continue;
        out.push({
          x0: s.x0 + 30,
          x1: s.x0 + s.w - 30,
          y0: s.y0,
          base: (b.y + b.h) * TS - 4,
          draw: c => (s.art ? c.drawImage(s.cv, s.x0, s.y0, s.w, s.h) : c.drawImage(s.cv, s.x0, s.y0))
        });
      }
      return out;
    }
    return Object.freeze({
      CATALOG,
      builtOf,
      current,
      draw,
      drawPrompts,
      drawTile,
      occluders,
      // Aperçu d'une façade (tests et outils) : style de LOOKS, posée sur la case (tx, ty).
      drawFacade: (c, style, tx, ty) =>
        drawBuilding(c, { style, x: tx, y: ty, w: 4, h: 3, room: ROOM.chene, label: style }),
      styles: () => Object.keys(LOOKS)
    });
  }
  window.CANAAN_HOUSE_RENDER = Object.freeze({ create });
})();
