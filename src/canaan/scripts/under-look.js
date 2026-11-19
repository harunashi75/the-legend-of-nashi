// Sol des Tréfonds au même rendu que l'île (world-roads.js, world-blend.js) : plus aucune case visible.
// - Sols continus : chaque sol de chaque biome (terre battue, gravier, dalles, carreaux, grosses pierres, mousse, boue)
//   et le dessus de la roche sont peints une fois en motifs sans couture de 256 px (blocs de 2 px), ancrés sur le monde.
// - Bords organiques : chaque niveau (eaux, boue, sol, chaussée, roche) forme un champ lissé (B-spline quadratique) des
//   cases voisines ; en chaque bloc de 2 px, le niveau le plus haut dont le champ dépasse un seuil bousculé par un
//   bruit fractal l'emporte. La pente du champ donne la distance au bord : talus éclairés en haut à gauche, berges
//   humides, liseré d'écume, chaussée aux bords ombrés.
// - Parois : la roche a un dessus sombre cerné d'encre et, au-dessus du sol qu'elle domine, une vraie face de falaise
//   (strates, fissures ou maçonnerie naine, rebord éclairé, pied dans l'ombre) dont le pied ondule ; elle projette
//   son ombre sur le sol. Les gouffres s'ouvrent sur une paroi qui plonge dans le noir.
// - Eaux animées (lacs, ruisseaux de boue, gouffres) peintes sous les blocs de sol, qui les laissent voir.
// Sol par blocs de 16 × 16 cases gardés (préparés d'avance quand le navigateur a du temps libre) ; sans canevas
// (tests sans écran), create() renvoie un rendu inactif et underground.js garde son dessin case par case.
(() => {
  'use strict';
  const S = 48,
    B = 24,
    P = 256,
    CH = 16,
    KEEP = 40;
  const LX = -0.6,
    LY = -0.8;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function create(api) {
    const { T, at, biomeAt, bridges, themeOf, BIOMES, WET } = api;
    // Crochets facultatifs (donjons, raids) ; par défaut, les Tréfonds.
    const key = api.key || (() => game.world.underworld),
      live = api.live || (() => !game.world.instance && game.world.layer === 'under'),
      deepOf = w => (api.deep ? api.deep(w) : w === T.CHASM),
      isRoom = api.isRoom || (() => false),
      houseTile = api.houseTile || (() => {});
    const kit = () => window.CANAAN_GROUND_KIT;
    const FLOORS = new Set([T.FLOOR, T.STONE, T.GRAVE, T.MOSS]);
    let probe;
    function active() {
      if (probe === undefined) {
        const K = kit();
        let ok = false;
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 4;
          const g = c.getContext?.('2d');
          ok = !!(
            K?.active() &&
            g &&
            typeof g.putImageData === 'function' &&
            g.createImageData?.(4, 4)?.data?.length === 64 &&
            typeof g.createPattern === 'function' &&
            typeof DOMMatrix !== 'undefined'
          );
        } catch {
          ok = false;
        }
        probe = ok;
      }
      return probe;
    }

    // ---------------------------------------------------------------- Bruits périodiques (motifs sans couture)
    const ih = (x, y, s) => kit().ih(x, y, s);
    function pv(x, y, cells, s) {
      const fx = (x / P) * cells,
        fy = (y / P) * cells,
        xi = Math.floor(fx),
        yi = Math.floor(fy),
        u = (fx - xi) * (fx - xi) * (3 - 2 * (fx - xi)),
        v = (fy - yi) * (fy - yi) * (3 - 2 * (fy - yi)),
        L = (a, b) => ih(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, s),
        a = L(xi, yi),
        b = L(xi + 1, yi),
        c = L(xi, yi + 1),
        d = L(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const pfbm = (x, y, c, s) =>
      pv(x, y, c, s) * 0.57 + pv(x, y, c * 2, s + 7) * 0.29 + pv(x, y, c * 4, s + 13) * 0.14;
    // Voronoï périodique : cellule la plus proche, distance au joint (e), centre et identifiant.
    const vor = { e: 0, id: 0, cx: 0, cy: 0, r: 0 };
    function pvor(x, y, cell, s) {
      const n = P / cell,
        gx = Math.floor(x / cell),
        gy = Math.floor(y / cell);
      let d1 = 1e9,
        d2 = 1e9;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const cx = gx + i,
            cy = gy + j,
            wx = ((cx % n) + n) % n,
            wy = ((cy % n) + n) % n,
            px = (cx + 0.15 + 0.7 * ih(wx, wy, s)) * cell,
            py = (cy + 0.15 + 0.7 * ih(wx, wy, s + 1)) * cell,
            dd = (px - x) * (px - x) + (py - y) * (py - y);
          if (dd < d1) {
            d2 = d1;
            d1 = dd;
            vor.id = ih(wx, wy, s + 2);
            vor.cx = px;
            vor.cy = py;
          } else if (dd < d2) d2 = dd;
        }
      vor.r = Math.sqrt(d1);
      vor.e = (Math.sqrt(d2) - vor.r) / 2;
      return vor;
    }

    // ---------------------------------------------------------------- Motifs des sols
    const col = [0, 0, 0];
    const set = c => {
      col[0] = c[0];
      col[1] = c[1];
      col[2] = c[2];
    };
    const mix = (c, t) => {
      col[0] += (c[0] - col[0]) * t;
      col[1] += (c[1] - col[1]) * t;
      col[2] += (c[2] - col[2]) * t;
    };
    const mul = k => {
      col[0] *= k;
      col[1] *= k;
      col[2] *= k;
    };
    const lit = (dx, dy, r) => Math.max(-1, Math.min(1, (dx * LX + dy * LY) / r));
    // Petit caillou (cellules de 8 px) éclairé en haut à gauche, ombre en bas à droite.
    function pebble(x, y, chance, s, stone) {
      const cx = x >> 3,
        cy = y >> 3,
        n = P >> 3,
        k = ih(((cx % n) + n) % n, ((cy % n) + n) % n, s);
      if (k > chance) return;
      const ox = 2 + Math.floor(ih(cx, cy, s + 1) * 2) * 2,
        oy = 2 + Math.floor(ih(cx, cy, s + 2) * 2) * 2,
        lx = (x & 7) - ox,
        ly = (y & 7) - oy;
      if (lx >= 0 && ly >= 0 && lx < 4 && ly < 3) {
        set(stone);
        mul(lx + ly < 3 ? 1.22 : 0.9);
      } else if (lx >= 1 && ly >= 1 && lx < 6 && ly < 5) mul(0.75);
    }
    // Un style de sol : couleur au point (x, y) du motif (pal : base a, sombre b, clair c).
    const SHADERS = {
      dirt(x, y, p, o) {
        const n = pfbm(x, y, 8, 11 + o.seed);
        set(p.a);
        if (n < 0.5) mix(p.b, (0.5 - n) * 1.7);
        else mix(p.c, (n - 0.5) * 1.5);
        // Terre tassée en plaques, fissures fines.
        const v = pvor(x, y, 32, 21 + o.seed);
        if (v.e < 0.9 && pv(x, y, 16, 23 + o.seed) > 0.55) mul(0.78);
        if (o.moss && pfbm(x, y, 16, 31 + o.seed) > 0.56) {
          mix(o.moss, 0.55 + 0.25 * pv(x, y, 64, 33));
          if (pv(x, y, 64, 34) > 0.62 && ih(x >> 2, y >> 2, 34) > 0.7) mix(o.mossLight || o.moss, 0.35);
        }
        if (o.grass && ih(x >> 1, y >> 1, 35) > 0.965) set(o.grass);
        if (o.bones && ih(x >> 2, y >> 2, 36) > 0.995) set([196, 188, 166]);
        if (o.spores && ih(x >> 1, y >> 1, 37) > 0.994)
          set(o.spores[Math.floor(ih(x, y, 38) * o.spores.length)]);
        pebble(x, y, o.pebbles ?? 0.08, 41 + o.seed, p.c);
      },
      gravel(x, y, p, o) {
        const v = pvor(x, y, 8, 51 + o.seed);
        if (v.e < 0.8) {
          set(p.b);
          mul(0.78);
          return;
        }
        set(v.id < 0.33 ? p.a : v.id < 0.7 ? lerp(p.a, p.c, 0.45) : p.b);
        mul(1 + 0.2 * lit(x - v.cx, y - v.cy, 4));
        mul(0.86 + 0.14 * Math.min(1, v.e / 2));
        if (o.moss && pfbm(x, y, 16, 53) > 0.62) mix(o.moss, 0.5);
      },
      flagstone(x, y, p, o) {
        const v = pvor(x, y, o.cell || 32, 61 + o.seed);
        if (v.e < 1.3) {
          set(p.b);
          mul(0.7);
          if (o.moss && pv(x, y, 32, 63) > 0.5) set(o.moss);
          return;
        }
        set(lerp(p.a, v.id > 0.5 ? p.c : p.b, Math.abs(v.id - 0.5) * 0.8));
        mul(1 + 0.14 * lit(x - v.cx, y - v.cy, 14));
        mul(0.84 + 0.16 * Math.min(1, v.e / 3));
        if (v.e < 2.6) mul(0.92);
        mul(0.94 + 0.12 * pv(x, y, 64, 64 + o.seed));
        // Fissure en travers d'une dalle sur cinq.
        if (v.id > 0.8) {
          const a = v.id * 40,
            ca = Math.cos(a),
            sa = Math.sin(a);
          if (
            Math.abs((x - v.cx) * sa - (y - v.cy) * ca) < 0.8 &&
            Math.abs((x - v.cx) * ca + (y - v.cy) * sa) < 6
          )
            mul(0.66);
        }
        // Rune gravée au cœur d'une dalle sur vingt-cinq : un losange et sa croix.
        if (o.rune && v.id < 0.04 && v.r < 7) {
          const ax = Math.abs(x - v.cx),
            ay = Math.abs(y - v.cy);
          if (Math.abs(ax + ay - 6) < 1 || (ax < 1 && ay < 5) || (ay < 1 && ax < 5)) mix(o.rune, 0.7);
        }
      },
      tiles(x, y, p, o) {
        const row = Math.floor(y / 16),
          off = (row & 1) * 16,
          c0 = Math.floor((x + off) / 32),
          lx = x + off - c0 * 32,
          ly = y - row * 16,
          id = ih(((c0 % 8) + 8) % 8, ((row % 16) + 16) % 16, 71 + o.seed);
        if (lx < 2 || ly < 2) {
          set(p.b);
          mul(0.72);
          if (o.rune && ly < 2 && lx >= 2 && pv(x, y, 4, 72) > 0.62) mix(o.rune, 0.55);
          return;
        }
        set(lerp(p.a, id > 0.5 ? p.c : p.b, Math.abs(id - 0.5)));
        mul(1 + 0.1 * Math.max(-1, Math.min(1, ((lx - 17) / 15) * LX + ((ly - 9) / 7) * LY)));
        if (lx > 30 || ly > 14) mul(0.84);
        if (id > 0.85 && Math.abs(lx - 12 - ly * 0.8) < 0.8) mul(0.7);
        mul(0.95 + 0.1 * pv(x, y, 32, 73 + o.seed));
      },
      stone(x, y, p, o) {
        const v = pvor(x, y, 32, 81 + o.seed);
        if (v.e < 1.4) {
          set(p.b);
          mul(0.68);
          return;
        }
        set(lerp(p.a, v.id > 0.5 ? p.c : p.b, Math.abs(v.id - 0.5) * 0.9));
        const n = pfbm(x, y, 16, 83 + o.seed);
        mix(n > 0.5 ? p.c : p.b, Math.abs(n - 0.5) * 0.9);
        mul(1 + 0.2 * lit(x - v.cx, y - v.cy, 14));
        mul(0.82 + 0.18 * Math.min(1, v.e / 4));
        if (o.moss && pfbm(x, y, 16, 85) > 0.6) mix(o.moss, 0.5);
      },
      // Marbre : grandes dalles polies, veines sinueuses, joints fins dorés ou sombres.
      marble(x, y, p, o) {
        const lx = x & 63,
          ly = y & 63,
          id = ih(((x >> 6) & 3) + 1, ((y >> 6) & 3) + 1, 121 + o.seed);
        if (lx < 2 || ly < 2) {
          set(o.joint || p.b);
          if (!o.joint) mul(0.8);
          return;
        }
        set(lerp(p.a, p.b, 0.15 + id * 0.25));
        const vein = Math.abs(pfbm(x, y, 4, 123 + o.seed) - 0.5 + 0.12 * Math.sin((x + y) / 23 + id * 6));
        if (vein < 0.02) mix(p.b, 0.75);
        else if (vein < 0.05) mix(p.b, 0.3);
        mul(1 + 0.08 * Math.max(-1, Math.min(1, ((lx - 32) / 30) * LX + ((ly - 32) / 30) * LY)));
        if (lx > 61 || ly > 61) mul(0.9);
      },
      // Basalte : colonnes hexagonales vues de dessus (cellules), arêtes vives, braises dans les joints.
      basalt(x, y, p, o) {
        const v = pvor(x, y, 16, 131 + o.seed);
        if (v.e < 1) {
          set(p.b);
          mul(0.55);
          if (o.glow && pv(x, y, 8, 133) > 0.8) mix(o.glow, 0.7);
          return;
        }
        set(lerp(p.a, v.id > 0.5 ? p.c : p.b, Math.abs(v.id - 0.5) * 0.9));
        mul(1 + 0.22 * lit(x - v.cx, y - v.cy, 8));
        mul(0.84 + 0.16 * Math.min(1, v.e / 3));
        if (ih(x >> 1, y >> 1, 134) > 0.97) mul(0.8);
      },
      // Dalles arcaniques : carreaux sombres traversés de lignes de lumière, glyphe au centre de quelques-uns.
      arcane(x, y, p, o) {
        const lx = x & 31,
          ly = y & 31,
          id = ih((x >> 5) & 7, (y >> 5) & 7, 141 + o.seed);
        if (lx < 2 || ly < 2) {
          set(p.b);
          mul(0.7);
          if (o.glow && pv(x, y, 4, 142) > 0.55) mix(o.glow, 0.6);
          return;
        }
        set(lerp(p.a, id > 0.5 ? p.c : p.b, Math.abs(id - 0.5) * 0.8));
        mul(1 + 0.1 * Math.max(-1, Math.min(1, ((lx - 16) / 14) * LX + ((ly - 16) / 14) * LY)));
        if (o.glow && id > 0.82) {
          const ax = Math.abs(lx - 16),
            ay = Math.abs(ly - 16);
          if (Math.abs(ax + ay - 7) < 1 || (ax < 1 && ay < 4)) mix(o.glow, 0.75);
        }
      },
      // Pierre d'étoiles : nuit pavée, constellations de points lumineux, nébuleuse douce.
      starstone(x, y, p, o) {
        const v = pvor(x, y, 32, 151 + o.seed);
        set(p.a);
        const n = pfbm(x, y, 4, 152 + o.seed);
        mix(lerp(p.a, [120, 90, 200], 0.4), Math.max(0, n - 0.5) * 0.9);
        if (v.e < 1.2) {
          set(p.b);
          mul(0.75);
          return;
        }
        mul(1 + 0.1 * lit(x - v.cx, y - v.cy, 14));
        const st = ih(x >> 1, y >> 1, 153);
        if (st > 0.992) set(p.c);
        else if (st > 0.982) mix(p.c, 0.45);
      },
      // Tapis : trame tissée, motif de losanges, usure au centre.
      carpet(x, y, p, o) {
        set(p.a);
        if ((x >> 1) % 2 === (y >> 1) % 2) mul(0.94);
        const ax = Math.abs((x & 31) - 16),
          ay = Math.abs((y & 31) - 16);
        if (Math.abs(ax + ay - 10) < 1.5) mix(p.c, 0.45);
        else if (ax + ay < 4) mix(p.b, 0.6);
        mul(0.92 + 0.12 * pv(x, y, 16, 161 + o.seed));
      },
      // Grille de fer : barreaux croisés, fond sombre qui luit par en dessous.
      grate(x, y, p, o) {
        const lx = x & 15,
          ly = y & 15;
        if (lx < 4 || ly < 4) {
          set(p.a);
          mul(lx < 2 || ly < 2 ? 1.18 : 0.9);
          if (pv(x, y, 16, 171) > 0.7) mix([110, 70, 40], 0.3);
          return;
        }
        set(p.b);
        mul(0.5);
        if (o.glow) mix(o.glow, 0.25 + 0.25 * pv(x, y, 8, 172 + o.seed));
      },
      // Voie de mine : gravier tassé (les rails et traverses sont posés par-dessus).
      rails(x, y, p, o) {
        SHADERS.gravel(x, y, { a: p.a, b: lerp(p.a, [0, 0, 0], 0.35), c: lerp(p.a, p.c, 0.4) }, o);
      },
      // Allée runique : dalles carrées, une rune lumineuse sur deux.
      runes(x, y, p, o) {
        const lx = x & 47,
          ly = y & 47,
          id = ih(Math.floor(x / 48) & 7, Math.floor(y / 48) & 7, 181 + o.seed);
        if (lx < 2 || ly < 2) {
          set(p.b);
          mul(0.7);
          return;
        }
        set(lerp(p.a, p.b, id * 0.4));
        mul(1 + 0.1 * Math.max(-1, Math.min(1, ((lx - 24) / 22) * LX + ((ly - 24) / 22) * LY)));
        if (id > 0.45) {
          const ax = Math.abs(lx - 24),
            ay = Math.abs(ly - 24),
            r = Math.hypot(ax, ay);
          if (Math.abs(r - 11) < 1 || (ax < 1 && ay < 8) || (ay < 1 && ax < 8 && id > 0.7)) mix(p.c, 0.8);
        }
        mul(0.94 + 0.1 * pv(x, y, 32, 183 + o.seed));
      },
      // Boue : flaques luisantes et traînées.
      mud(x, y, p, o) {
        const n = pfbm(x, y, 8, 91 + o.seed);
        set(p.a);
        mix(n > 0.5 ? p.c : p.b, Math.abs(n - 0.5) * 1.3);
        const w = pfbm(x, y * 1.6, 16, 93 + o.seed);
        if (w > 0.6) mul(0.82);
        if (w > 0.66 && ih(x >> 1, y >> 1, 94) > 0.9) mix([230, 220, 190], 0.4);
        pebble(x, y, 0.03, 95, p.c);
      },
      // Dessus de la roche : sombre, en masses craquelées, quelques cailloux et taches de lichen.
      rock(x, y, p, o) {
        const v = pvor(x, y, 32, 101 + o.seed);
        set(p.a);
        const n = pfbm(x, y, 8, 103 + o.seed);
        mix(n > 0.5 ? p.c : p.b, Math.abs(n - 0.5) * 1.4);
        mul(1 + 0.22 * lit(x - v.cx, y - v.cy, 16));
        if (v.e < 1.2) set(p.b);
        if (o.moss && pfbm(x, y, 16, 105) > 0.64) mix(o.moss, 0.35);
        pebble(x, y, 0.06, 107, p.c);
      }
    };
    // Habillage propre à chaque biome (indice des biomes ; 4 : forteresse).
    const DRESS = [
      { pebbles: 0.05 },
      { moss: [70, 96, 88], rune: [120, 190, 230] },
      { grass: [96, 104, 74], bones: true, moss: [62, 82, 58] },
      {
        moss: [86, 120, 62],
        mossLight: [140, 176, 92],
        spores: [
          [255, 150, 230],
          [150, 255, 236],
          [230, 200, 255]
        ]
      },
      { rune: [255, 200, 100] }
    ];
    const PATTERNS = new Map();
    function pattern(key, style, pal, o) {
      if (PATTERNS.has(key)) return PATTERNS.get(key);
      const cv = document.createElement('canvas');
      cv.width = cv.height = P;
      const g = cv.getContext('2d'),
        img = g.createImageData(P, P),
        d = img.data,
        p = { a: rgb(pal.a), b: rgb(pal.b), c: rgb(pal.c) },
        fn = SHADERS[style] || SHADERS.dirt;
      for (let y = 0; y < P; y += 2)
        for (let x = 0; x < P; x += 2) {
          fn(x, y, p, o);
          for (let q = 0; q < 4; q++) {
            const k = ((y + (q >> 1)) * P + x + (q & 1)) * 4,
              grain = 1 + (ih(x + (q & 1), y + (q >> 1), 7) - 0.5) * 0.06;
            d[k] = col[0] * grain;
            d[k + 1] = col[1] * grain;
            d[k + 2] = col[2] * grain;
            d[k + 3] = 255;
          }
        }
      g.putImageData(img, 0, 0);
      const out = { data: d, canvas: cv };
      PATTERNS.set(key, out);
      return out;
    }
    // Motif d'un sol (b : biome, t : case), du dessus de la roche ('rock') ou de la boue.
    // Mémo par (biome, case) : appelé pour chaque bloc de 2 px des cases de bord.
    const FLOOR_PAT = new Map();
    function floorPattern(b, t) {
      const id = b * 4096 + (t === 'rock' ? 4095 : t);
      let pat = FLOOR_PAT.get(id);
      if (!pat) FLOOR_PAT.set(id, (pat = makeFloorPattern(b, t)));
      return pat;
    }
    function makeFloorPattern(b, t) {
      const th = themeOf(b),
        o = { ...(api.dress ? api.dress(b) : DRESS[b]), seed: b * 3 };
      if (t === 'rock') {
        const w = th.wall;
        return pattern(
          b + ':rock',
          'rock',
          api.rockPal?.(b) || { a: mixHex(w.dark, w.top, 0.45), b: w.top, c: mixHex(w.dark, w.face, 0.5) },
          o
        );
      }
      if (t === T.MUD) {
        const m = (BIOMES[b % 4] || BIOMES[0]).mud;
        return pattern(b + ':mud', 'mud', m, o);
      }
      const bio = b === 4 ? BIOMES[0] : BIOMES[b],
        p = th.floors[t] || th.floors[bio.floor] || th.floors[T.STONE] || Object.values(th.floors)[0];
      return pattern(b + ':' + t, p.style, p, o);
    }
    function mixHex(a, b, t) {
      return (
        '#' +
        lerp(rgb(a), rgb(b), t)
          .map(v => Math.round(v).toString(16).padStart(2, '0'))
          .join('')
      );
    }

    // ---------------------------------------------------------------- Niveaux des cases
    // 0 eaux (lac, ruisseau, gouffre, et sous un pont) ; 1 boue ; 2 sol ; 3 chaussée ; 4 roche (et tout le reste).
    function level(x, y) {
      if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return 4;
      if (bridges.has(y * MAPW + x)) return 0;
      const t = at(x, y);
      if (WET.has(t)) return 0;
      if (t === T.MUD) return 1;
      if (FLOORS.has(t)) return 2;
      if (t === T.PATH) return 3;
      return 4;
    }
    // Eau à peindre sous une case : la sienne, celle du pont, ou celle d'une voisine (bords qui débordent) ; -1 aucune.
    let underMap = null,
      underFor = null;
    function liquidUnder(x, y) {
      if (underFor !== key()) {
        underMap = new Int8Array(MAPW * MAPH).fill(-2);
        underFor = key();
      }
      const k = y * MAPW + x;
      if (underMap[k] !== -2) return underMap[k];
      let w = -1;
      const own = bridges.get(k) ?? at(x, y);
      if (WET.has(own)) w = own;
      else
        for (let j = -1; j <= 1 && w < 0; j++)
          for (let i = -1; i <= 1 && w < 0; i++) {
            if (x + i < 0 || y + j < 0 || x + i >= MAPW || y + j >= MAPH) continue;
            const n = bridges.get((y + j) * MAPW + x + i) ?? at(x + i, y + j);
            if (WET.has(n)) w = n;
          }
      underMap[k] = w;
      return w;
    }

    // ---------------------------------------------------------------- Couleurs des parois
    const WALLS = new Map();
    function wallPal(b) {
      if (WALLS.has(b)) return WALLS.get(b);
      const w = themeOf(b).wall,
        p = {
          top: rgb(w.top),
          face: rgb(w.face),
          dark: rgb(w.dark),
          light: rgb(w.light),
          brick: w.style === 'brick',
          ink: lerp(rgb(w.top), [0, 0, 0], 0.5)
        };
      WALLS.set(b, p);
      return p;
    }
    // Face de falaise au-dessus du sol : u blocs au-dessus du pied, h blocs de haut.
    function faceColor(b, wx, u, h) {
      const W = wallPal(b),
        K = kit();
      if (W.brick) {
        // Maçonnerie : assises de 10 px, pierres de 22 px décalées d'une demi-pierre, joints sombres.
        const row = Math.floor(u / 5),
          off = row & 1 ? 11 : 0,
          bx = Math.floor(((wx >> 1) + off) / 11),
          inRow = u % 5,
          inCol = ((wx >> 1) + off) % 11,
          id = ih(bx, row, 111 + b);
        if (inRow === 4 || inCol === 0) {
          set(W.dark);
          mul(0.72);
        } else {
          set(lerp(W.face, id > 0.5 ? W.light : W.dark, Math.abs(id - 0.5) * 0.8));
          if (inRow === 3) mul(1.14);
          if (inCol === 10) mul(0.86);
          if (id > 0.9 && inCol === 5) mul(0.75);
        }
      } else {
        // Roche en strates qui ondulent, fissures verticales, éclats clairs.
        const s = u + (K.fbm(wx / 70, 0.5, 113 + b) - 0.5) * 10,
          band = Math.floor(s / 4);
        set(W.face);
        mix(band & 1 ? W.dark : W.light, 0.22 + 0.2 * ih(band, 0, 114 + b));
        const n = K.vnoise(wx / 10, s / 2, 115 + b);
        if (n > 0.7) mix(W.light, (n - 0.7) * 1.6);
        else if (n < 0.25) mul(0.84);
        const cr = Math.floor(wx / 26);
        if (ih(cr, band >> 1, 116 + b) > 0.62 && Math.abs((wx % 26) - 13 - (u & 1)) < 1.5) mul(0.6);
        if (s % 4 < 0.7) mul(0.84);
      }
      // Rebord éclairé en haut, pied dans l'ombre.
      mul(0.8 + 0.32 * Math.min(1, u / h));
      if (u >= h - 1) mix(W.light, 0.55);
      if (u < 3) mul(0.62 + u * 0.1);
    }

    // ---------------------------------------------------------------- Calcul d'un bloc de sol
    // Peinture d'un bloc de 16 × 16 cases, une rangée de cases par étape (générateur) : la préparation d'avance
    // s'arrête à l'heure limite et reprend au temps libre suivant. Renvoie la toile (null : pas de canevas).
    function* paintChunk(cx, cy) {
      const K = kit(),
        { Q, DQ, fbm, vnoise, smooth } = K,
        N = CH * S,
        X0 = cx * CH,
        Y0 = cy * CH,
        cv = document.createElement('canvas');
      cv.width = cv.height = N;
      const g = cv.getContext('2d');
      if (!g?.createImageData) return null;
      const img = g.createImageData(N, N),
        out = img.data;
      // Niveaux et cases du bloc, avec une marge (2 cases autour, 5 en bas pour les faces de falaise).
      const M0 = 3,
        MW = CH + 6,
        MH = CH + 9,
        LV = new Int8Array(MW * MH),
        TT = new Int16Array(MW * MH),
        BI = new Int8Array(MW * MH);
      for (let j = 0; j < MH; j++)
        for (let i = 0; i < MW; i++) {
          const x = X0 + i - M0,
            y = Y0 + j - M0,
            k = j * MW + i;
          LV[k] = level(x, y);
          TT[k] = x < 0 || y < 0 || x >= MAPW || y >= MAPH ? T.WALL : at(x, y);
          BI[k] = biomeAt(Math.max(0, Math.min(MAPW - 1, x)), Math.max(0, Math.min(MAPH - 1, y)));
        }
      const lv = (x, y) => LV[(y - Y0 + M0) * MW + x - X0 + M0];
      const tt = (x, y) => TT[(y - Y0 + M0) * MW + x - X0 + M0];
      const bi = (x, y) => BI[(y - Y0 + M0) * MW + x - X0 + M0];
      // Roche au bloc de 2 px (gx, gy en blocs du monde) : champ, pente et seuil ; mémo par bloc.
      const RB = CH * B,
        RT = 12,
        RH = RB + RT + 42,
        rockMemo = new Int8Array(RB * RH).fill(-1);
      const rk = { f: 0, gx: 0, gy: 0, thr: 0 };
      // Parois bâties (api.rockSharp > 1) : la transition est resserrée vers le bord de la case, coins plus vifs.
      const SH = api.rockSharp || 1,
        sharp = v =>
          SH === 1 ? v : Math.max(0, Math.min(B - 1, Math.round(B / 2 - 0.5 + (v - B / 2 + 0.5) * SH)));
      function rockField(gx, gy) {
        const tx = Math.floor(gx / B),
          ty = Math.floor(gy / B),
          bx = sharp(gx - tx * B),
          by = sharp(gy - ty * B),
          wx = gx * 2 + 1,
          wy = gy * 2 + 1;
        let f = 0,
          fx = 0,
          fy = 0;
        for (let j = -1; j <= 1; j++) {
          const qy = Q[by * 5 + j + 2],
            dqy = DQ[by * 5 + j + 2];
          for (let i = -1; i <= 1; i++) {
            if (lv(tx + i, ty + j) !== 4) continue;
            const qx = Q[bx * 5 + i + 2];
            f += qx * qy;
            fx += DQ[bx * 5 + i + 2] * qy;
            fy += qx * dqy;
          }
        }
        rk.f = f;
        rk.gx = (fx / S) * SH;
        rk.gy = (fy / S) * SH;
        // Loin de toute roche : pas de bruit à calculer (le seuil ne descend jamais sous 0,2).
        if (f < 0.01) {
          rk.thr = 0.5;
          return false;
        }
        const amp = api.rockAmp ? api.rockAmp(bi(tx, ty)) : bi(tx, ty) === 4 ? 0.35 : 1;
        rk.thr =
          0.5 +
          (fbm(wx / 34, wy / 34, 231) - 0.5) * 0.46 * amp +
          (vnoise(wx / 7, wy / 7, 232) - 0.5) * 0.13 * amp;
        return f > rk.thr;
      }
      function isRock(gx, gy) {
        const lx = gx - X0 * B,
          ly = gy - Y0 * B + RT;
        if (lx < 0 || lx >= RB || ly < 0 || ly >= RH) return rockField(gx, gy);
        const k = ly * RB + lx;
        if (rockMemo[k] < 0) rockMemo[k] = rockField(gx, gy) ? 1 : 0;
        return rockMemo[k] === 1;
      }
      // Hauteur de la face (en blocs), qui varie le long de la paroi.
      const faceH = gx => 22 + Math.floor(vnoise(gx / 9, 0.5, 233) * 8);
      const f = new Float32Array(4),
        fgx = new Float32Array(4),
        fgy = new Float32Array(4),
        occ = new Int8Array(9);
      // Pixels d'un motif (b, t) au point du monde.
      const put = (o, pat, wx, wy, shade) => {
        const s = ((wy & (P - 1)) * P + (wx & (P - 1))) * 4,
          d = pat.data;
        out[o] = d[s] * shade;
        out[o + 1] = d[s + 1] * shade;
        out[o + 2] = d[s + 2] * shade;
        out[o + 3] = 255;
      };
      const fill = (bx0, by0, r, g2, b2, a) => {
        for (let q = 0; q < 4; q++) {
          const o = ((by0 + (q >> 1)) * N + bx0 + (q & 1)) * 4;
          out[o] = r;
          out[o + 1] = g2;
          out[o + 2] = b2;
          out[o + 3] = a;
        }
      };
      // Sol d'une case : type et biome autour du point, bousculés par un bruit (limites qui ondulent).
      function groundAt(tx, ty, wx, wy) {
        if (uniform(tx, ty))
          return floorPattern(bi(tx, ty), FLOORS.has(tt(tx, ty)) ? tt(tx, ty) : dominantFloor(tx, ty));
        const j = (fbm(wx / 44, wy / 44, 121) - 0.5) * 56,
          sx = Math.floor((wx + j) / S),
          sy = Math.floor((wy - j) / S),
          inside = Math.abs(sx - tx) <= 1 && Math.abs(sy - ty) <= 1;
        let t = inside ? tt(sx, sy) : tt(tx, ty);
        const b = inside ? bi(sx, sy) : bi(tx, ty);
        if (!FLOORS.has(t)) t = FLOORS.has(tt(tx, ty)) ? tt(tx, ty) : dominantFloor(tx, ty);
        return floorPattern(b, t);
      }
      // Même sol et même biome sur les 3 × 3 cases (roche à part) : pas besoin de bousculer la limite.
      const UNI = new Map();
      function uniform(tx, ty) {
        const key = ty * 4096 + tx;
        if (UNI.has(key)) return UNI.get(key);
        const t = tt(tx, ty),
          b = bi(tx, ty);
        let ok = true;
        for (let j = -1; j <= 1 && ok; j++)
          for (let i = -1; i <= 1 && ok; i++) {
            const u = tt(tx + i, ty + j);
            if (bi(tx + i, ty + j) !== b || (FLOORS.has(u) && u !== t) || (FLOORS.has(u) && !FLOORS.has(t)))
              ok = false;
          }
        UNI.set(key, ok);
        return ok;
      }
      const DOM = new Map();
      function dominantFloor(tx, ty) {
        const key = ty * 4096 + tx;
        if (DOM.has(key)) return DOM.get(key);
        const count = {};
        let best = -1,
          most = 0;
        for (let j = -2; j <= 2; j++)
          for (let i = -2; i <= 2; i++) {
            const u = tt(tx + i, ty + j);
            if (!FLOORS.has(u)) continue;
            count[u] = (count[u] || 0) + 1;
            if (count[u] > most) {
              most = count[u];
              best = u;
            }
          }
        if (best < 0) best = bi(tx, ty) === 4 ? T.STONE : (BIOMES[bi(tx, ty)]?.floor ?? T.FLOOR);
        DOM.set(key, best);
        return best;
      }
      function liquidAt(tx, ty, wx, wy) {
        const j = (fbm(wx / 30, wy / 30, 125) - 0.5) * 30,
          sx = Math.floor((wx + j) / S),
          sy = Math.floor((wy - j) / S);
        const w = Math.abs(sx - tx) <= 1 && Math.abs(sy - ty) <= 1 ? liquidUnder(sx, sy) : -1;
        return w >= 0 ? w : liquidUnder(tx, ty);
      }
      // Case entière sans bord : recopie du motif.
      function plain(tx, ty, ox, oy) {
        const l = lv(tx, ty),
          t = tt(tx, ty),
          b = bi(tx, ty);
        if (l === 4) {
          for (let j = -1; j <= 3; j++)
            for (let i = -1; i <= 1; i++) if (lv(tx + i, ty + j) !== 4) return false;
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) if (bi(tx + i, ty + j) !== b) return false;
        } else
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++)
              if (tt(tx + i, ty + j) !== t || bi(tx + i, ty + j) !== b || lv(tx + i, ty + j) !== l)
                return false;
        // Près d'une paroi au-dessus, l'ombre portée descend sur la case : bord.
        if (l < 4) for (let i = -1; i <= 1; i++) if (lv(tx + i, ty - 2) === 4) return false;
        if (l === 0) return true;
        const pat = l === 4 ? floorPattern(b, 'rock') : l === 1 ? floorPattern(b, T.MUD) : floorPattern(b, t);
        const d = pat.data;
        for (let y = 0; y < S; y++) {
          const wy = ty * S + y,
            sy = (wy & (P - 1)) * P,
            o = ((oy + y) * N + ox) * 4,
            sx = (tx * S) & (P - 1),
            first = Math.min(S, P - sx);
          out.set(d.subarray((sy + sx) * 4, (sy + sx + first) * 4), o);
          if (first < S) out.set(d.subarray(sy * 4, (sy + S - first) * 4), o + first * 4);
        }
        return true;
      }
      // Case de bord : calcul bloc par bloc.
      function edge(tx, ty, ox, oy) {
        // Niveaux sous la roche : la roche compte comme du sol (sa face se pose sur le sol).
        let lo = 9,
          hi = -1;
        for (let j = -1; j <= 1; j++)
          for (let i = -1; i <= 1; i++) {
            const l = lv(tx + i, ty + j),
              u = l === 4 ? 2 : l;
            occ[(j + 1) * 3 + i + 1] = u;
            if (u < lo) lo = u;
            if (u > hi) hi = u;
          }
        for (let by = 0; by < B; by++)
          for (let bx = 0; bx < B; bx++) {
            const gx = tx * B + bx,
              gy = ty * B + by,
              wx = gx * 2 + 1,
              wy = gy * 2 + 1;
            // Roche : dessus ou face de falaise (champ recalculé : le mémo ne garde que oui ou non).
            const rock = rockField(gx, gy),
              rf = rk.f,
              rgx = rk.gx,
              rgy = rk.gy,
              rthr = rk.thr;
            if (rock) {
              const H = faceH(gx);
              let k = 1;
              while (k <= H + 2 && isRock(gx, gy + k)) k++;
              const b = bi(tx, ty);
              if (k <= H) {
                faceColor(b, wx, k - 1, H);
                fill(ox + bx * 2, oy + by * 2, col[0], col[1], col[2], 255);
                continue;
              }
              // Dessus : cerne d'encre au bord, liseré éclairé du côté de la lumière, rebord au-dessus d'une face.
              const gl = Math.hypot(rgx, rgy),
                d = gl > 0.0015 ? (rf - rthr) / gl : 60,
                L = gl > 0.0015 ? (rgx * LX + rgy * LY) / gl : 0,
                W = wallPal(b),
                pat = floorPattern(b, 'rock');
              if (d < 2.2 || k === H + 1) {
                fill(ox + bx * 2, oy + by * 2, W.ink[0], W.ink[1], W.ink[2], 255);
                continue;
              }
              let shade = 1;
              if (d < 7 && L < 0) shade *= 1 + 0.5 * -L * (1 - d / 7);
              if (k === H + 2) shade *= 1.35;
              for (let q = 0; q < 4; q++) {
                const px = bx * 2 + (q & 1),
                  py = by * 2 + (q >> 1);
                put(((oy + py) * N + ox + px) * 4, pat, tx * S + px, ty * S + py, shade);
              }
              continue;
            }
            // Niveaux d'en bas : eaux, boue, sol, chaussée.
            let win = lo;
            if (hi > lo) {
              const thr =
                0.5 + (fbm(wx / 38, wy / 38, 201) - 0.5) * 0.4 + (vnoise(wx / 8, wy / 8, 202) - 0.5) * 0.08;
              for (let L = lo + 1; L <= hi; L++) {
                let a = 0,
                  ax = 0,
                  ay = 0;
                for (let j = 0; j < 3; j++) {
                  const qy = Q[by * 5 + j + 1],
                    dqy = DQ[by * 5 + j + 1];
                  for (let i = 0; i < 3; i++) {
                    if (occ[j * 3 + i] < L) continue;
                    const qx = Q[bx * 5 + i + 1];
                    a += qx * qy;
                    ax += DQ[bx * 5 + i + 1] * qy;
                    ay += qx * dqy;
                  }
                }
                // La chaussée a son propre seuil (bords plus nets, comme les routes).
                const th =
                  L === 3 ? (api.pathSharp ? 0.5 : 0.5 + (fbm(wx / 40, wy / 40, 3) - 0.5) * 0.3) : thr;
                f[L] = a - th;
                fgx[L] = ax / S;
                fgy[L] = ay / S;
                if (a > th) win = L;
              }
            }
            const dist = L => {
              const gl = Math.hypot(fgx[L], fgy[L]);
              return gl > 0.0015 ? f[L] / gl : f[L] > 0 ? 60 : -60;
            };
            const litOf = L => {
              const gl = Math.hypot(fgx[L], fgy[L]);
              return gl > 0.0015 ? (fgx[L] * LX + fgy[L] * LY) / gl : 0;
            };
            // Ombre de la roche sur le sol : plus forte quand la paroi est en haut ou à gauche.
            let shade = 1;
            const rgl = Math.hypot(rgx, rgy);
            if (rf > 0.01 && rgl > 0.0015) {
              const d = (rf - rthr) / rgl,
                L = (rgx * LX + rgy * LY) / rgl;
              if (d > -14) shade *= 1 - (0.2 + 0.24 * Math.max(0, L)) * (1 + d / 14);
            }
            if (win === 0) {
              const w = liquidAt(tx, ty, wx, wy);
              let r = 0,
                gg = 0,
                bb = 0,
                a = 0;
              if (deepOf(w)) {
                // Paroi du gouffre : la terre plonge dans le noir sous le bord d'en haut.
                let k = 1;
                while (k <= 12 && !landAbove(gx, gy - k)) k++;
                if (k <= 12) {
                  const W = wallPal(bi(tx, ty)),
                    t = k / 12;
                  faceColor(bi(tx, ty), wx, 12 - k, 12);
                  const fade = (1 - t) * (1 - t);
                  r = col[0] * fade;
                  gg = col[1] * fade;
                  bb = col[2] * fade;
                  a = 255;
                  if (k === 1) {
                    r = W.light[0] * 0.7;
                    gg = W.light[1] * 0.7;
                    bb = W.light[2] * 0.7;
                  }
                }
              } else if (hi > 0) {
                const d = dist(1),
                  shore = (BIOMES[bi(tx, ty) % 4] || BIOMES[0])[w === T.RIVER ? 'river' : 'lake'].c;
                if (d > -3.5) {
                  const c = rgb(shore);
                  r = Math.min(255, c[0] * 1.15 + 30);
                  gg = Math.min(255, c[1] * 1.15 + 30);
                  bb = Math.min(255, c[2] * 1.15 + 30);
                  a = Math.round(255 * 0.5 * (1 + d / 3.5));
                  if (ih(wx >> 1, wy >> 1, 203) > 0.75) a = Math.round(a * 0.4);
                }
              }
              fill(ox + bx * 2, oy + by * 2, r * shade, gg * shade, bb * shade, a);
              continue;
            }
            let pat;
            if (win === 3) pat = floorPattern(bi(tx, ty), T.PATH);
            else if (win === 1) pat = floorPattern(bi(tx, ty), T.MUD);
            else pat = groundAt(tx, ty, wx, wy);
            if (win > lo) {
              // Berge humide au bord de l'eau ; talus éclairé ailleurs.
              const wet = lo === 0 ? dist(1) : 60,
                d = dist(win);
              if (wet < 6) shade *= 0.66 + 0.34 * smooth(0, 6, wet);
              else if (d < 6) shade *= 1 + 0.3 * litOf(win) * (1 - d / 6) * (win === 3 ? 1 : 0.7);
              if (win === 3) shade *= 1 - 0.18 * (1 - smooth(0, 8, d));
              // Liseré d'une allée (tapis) : bande d'or le long de son bord.
              const rim = win === 3 && api.pathBorder?.(bi(tx, ty));
              if (rim && d < 5) {
                const k = (d < 1.2 ? 0.6 : 1) * shade;
                fill(ox + bx * 2, oy + by * 2, rim[0] * k, rim[1] * k, rim[2] * k, 255);
                continue;
              }
            }
            if (win < hi && win > 0) {
              const d = dist(win + 1),
                L = litOf(win + 1);
              if (d > -6 && L > 0) shade *= 1 - 0.24 * L * (1 + d / 6);
            }
            for (let q = 0; q < 4; q++) {
              const px = bx * 2 + (q & 1),
                py = by * 2 + (q >> 1);
              put(((oy + py) * N + ox + px) * 4, pat, tx * S + px, ty * S + py, shade);
            }
          }
      }
      // Terre ferme (ni eau ni roche) au bloc (gx, gy) : pour la paroi des gouffres.
      function landAbove(gx, gy) {
        if (isRock(gx, gy)) return true;
        // Même bord organique que les cases de bord : le champ du niveau « terre » (boue et au-dessus, roche comptée
        // comme sol) dépasse le seuil bruité.
        const tx = Math.floor(gx / B),
          ty = Math.floor(gy / B),
          bx = gx - tx * B,
          by = gy - ty * B,
          wx = gx * 2 + 1,
          wy = gy * 2 + 1;
        let lo = 9,
          hi = -1,
          a = 0;
        for (let j = -1; j <= 1; j++)
          for (let i = -1; i <= 1; i++) {
            const l = lv(tx + i, ty + j),
              u = l === 4 ? 2 : l;
            if (u < lo) lo = u;
            if (u > hi) hi = u;
            if (u >= 1) a += Q[bx * 5 + i + 2] * Q[by * 5 + j + 2];
          }
        if (lo >= 1) return true;
        if (hi < 1) return false;
        return (
          a > 0.5 + (fbm(wx / 38, wy / 38, 201) - 0.5) * 0.4 + (vnoise(wx / 8, wy / 8, 202) - 0.5) * 0.08
        );
      }
      const rooms = [];
      for (let y = Y0; y < Math.min(MAPH, Y0 + CH); y++)
        for (let x = X0; x < Math.min(MAPW, X0 + CH); x++) {
          const ox = (x - X0) * S,
            oy = (y - Y0) * S;
          if (isRoom(x, y)) {
            rooms.push([x, y]);
            continue;
          }
          if (!plain(x, y, ox, oy)) edge(x, y, ox, oy);
          if (x === X0 + CH - 1) yield null;
        }
      g.putImageData(img, 0, 0);
      g.translate(-X0 * S, -Y0 * S);
      g.imageSmoothingEnabled = false;
      // Grandes nuances de lumière sur tout le sol (motif sans couture), seulement sur ce qui est peint.
      const macro = macroPattern(g);
      if (macro) {
        g.save();
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = macro;
        g.fillRect(X0 * S, Y0 * S, N, N);
        g.restore();
      }
      // Ponts de planches, au-dessus de l'eau.
      for (let y = Y0; y < Math.min(MAPH, Y0 + CH); y++)
        for (let x = X0; x < Math.min(MAPW, X0 + CH); x++) if (bridges.has(y * MAPW + x)) bridge(g, x, y);
      for (const [x, y] of rooms) houseTile(g, x, y);
      api.afterChunk?.(g, X0, Y0, Math.min(MAPW, X0 + CH), Math.min(MAPH, Y0 + CH));
      return cv;
    }
    let MACRO;
    function macroPattern(g) {
      if (MACRO !== undefined) return MACRO;
      MACRO = null;
      const Pm = 384,
        cv = document.createElement('canvas');
      cv.width = cv.height = Pm;
      const mg = cv.getContext('2d'),
        img = mg.createImageData(Pm, Pm),
        d = img.data,
        n = (x, y, c, s) => pv((x * P) / Pm, (y * P) / Pm, c, s);
      for (let y = 0; y < Pm; y += 4)
        for (let x = 0; x < Pm; x += 4) {
          const v = n(x, y, 3, 261) * 0.6 + n(x, y, 6, 262) * 0.3 + n(x, y, 12, 263) * 0.1,
            light = v > 0.5,
            a = Math.round(255 * Math.min(0.18, Math.abs(v - 0.5) * (light ? 0.45 : 0.7)));
          for (let k = 0; k < 16; k++) {
            const o = ((y + (k >> 2)) * Pm + x + (k & 3)) * 4;
            d[o] = light ? 255 : 6;
            d[o + 1] = light ? 236 : 8;
            d[o + 2] = light ? 200 : 14;
            d[o + 3] = a;
          }
        }
      mg.putImageData(img, 0, 0);
      MACRO = g.createPattern(cv, 'repeat');
      return MACRO;
    }
    // Pont de planches d'un seul tenant : planches continues d'une case à l'autre, posées en travers du passage (le
    // sens du passage est celui où le pont est le plus long), longerons et cordes sur les seuls bords extérieurs,
    // ombre portée sur l'eau.
    const PLANKS = ['#8a6238', '#7a5430', '#94683c', '#6e4a2a', '#84603a'];
    // Sens de chaque pont (tout le pont d'un seul tenant) : nord-sud s'il est plus haut que large.
    let axes = null,
      axesFor = null;
    function bridgeAxis(x, y) {
      if (axesFor !== key()) {
        axes = new Map();
        axesFor = key();
        for (const k0 of bridges.keys()) {
          if (axes.has(k0)) continue;
          const part = [k0];
          let x0 = 1e9,
            x1 = -1,
            y0 = 1e9,
            y1 = -1;
          axes.set(k0, false);
          for (let h = 0; h < part.length; h++) {
            const k = part[h],
              px = k % MAPW,
              py = (k - px) / MAPW;
            x0 = Math.min(x0, px);
            x1 = Math.max(x1, px);
            y0 = Math.min(y0, py);
            y1 = Math.max(y1, py);
            for (const n of [k + 1, k - 1, k + MAPW, k - MAPW])
              if (bridges.has(n) && !axes.has(n)) {
                axes.set(n, false);
                part.push(n);
              }
          }
          const ns = y1 - y0 >= x1 - x0;
          for (const k of part) axes.set(k, ns);
        }
      }
      return axes.get(y * MAPW + x) ?? true;
    }
    function bridge(g, x, y) {
      const X = x * S,
        Y = y * S,
        on = (i, j) => bridges.has((y + j) * MAPW + x + i),
        ns = bridgeAxis(x, y),
        // a : axe le long des planches ; les bords « avant » et « après » sont ceux du passage.
        sideA = ns ? !on(-1, 0) : !on(0, -1),
        sideB = ns ? !on(1, 0) : !on(0, 1),
        r = (u, v, w, h, col) => {
          g.fillStyle = col;
          if (ns) g.fillRect(X + u, Y + v, w, h);
          else g.fillRect(X + v, Y + u, h, w);
        },
        base = ns ? Y : X;
      // u : position dans la largeur du pont (0 à 48), v : le long du passage.
      const u0 = sideA ? 6 : 0,
        u1 = sideB ? 42 : 48;
      g.fillStyle = 'rgba(0,0,0,.32)';
      if (ns) g.fillRect(X + u0 + 4, Y + 6, u1 - u0, 48);
      else g.fillRect(X + 6, Y + u0 + 4, 48, u1 - u0);
      for (let v = 0; v < 48; v += 8) {
        const n = Math.floor((base + v) / 8),
          tone = PLANKS[Math.floor(ih(n, ns ? 1 : 2, 301) * PLANKS.length)],
          ja = sideA ? Math.floor(ih(n, 3, 302) * 3) : 0,
          jb = sideB ? Math.floor(ih(n, 4, 303) * 3) : 0;
        r(u0 - ja, v, u1 - u0 + ja + jb, 8, '#2a1810');
        r(u0 - ja + (sideA ? 1 : 0), v + 1, u1 - u0 + ja + jb - (sideA ? 1 : 0) - (sideB ? 1 : 0), 6, tone);
        r(
          u0 - ja + (sideA ? 1 : 0),
          v + 1,
          u1 - u0 + ja + jb - (sideA ? 1 : 0) - (sideB ? 1 : 0),
          1,
          'rgba(255,230,180,.25)'
        );
        if (ih(n, x + y, 304) > 0.55) r(u0 + 4 + Math.floor(ih(n, 5, 305) * 30), v + 3, 2, 2, '#3a2416');
        if (sideA) r(u0 + 2, v + 3, 1, 1, '#c8c0a8');
        if (sideB) r(u1 - 3, v + 3, 1, 1, '#c8c0a8');
      }
      // Longerons et cordes sur les bords extérieurs.
      if (sideA) {
        r(u0 - 4, 0, 4, 48, '#4a3020');
        r(u0 - 5, 0, 1, 48, '#c8b080');
        if ((base / S) % 2 === 0) r(u0 - 6, 20, 6, 6, '#3a2416');
      }
      if (sideB) {
        r(u1, 0, 4, 48, '#4a3020');
        r(u1 + 4, 0, 1, 48, '#c8b080');
        if ((base / S) % 2 === 0) r(u1, 20, 6, 6, '#3a2416');
      }
    }

    // ---------------------------------------------------------------- Eaux animées
    const LIQ = new Map();
    function liquidPatterns(c, w, b) {
      const key = w + ':' + b;
      if (LIQ.has(key)) return LIQ.get(key);
      LIQ.set(key, null);
      const bio = BIOMES[b % 4] || BIOMES[0],
        Pw = 256,
        base = document.createElement('canvas'),
        glint = document.createElement('canvas');
      base.width = base.height = glint.width = glint.height = Pw;
      const bg = base.getContext('2d'),
        gg = glint.getContext('2d'),
        img = bg.createImageData(Pw, Pw),
        d = img.data;
      let tones, glints, speed, streak;
      const own = api.liquidLook?.(w, b);
      if (own) ({ tones, glints, speed, streak } = own);
      else if (w === T.CHASM) {
        tones = [
          [3, 3, 6],
          [6, 6, 12],
          [10, 9, 18],
          [16, 14, 26]
        ];
        glints = ['#3a3460', '#5a5490'];
        speed = 0.15;
        streak = 1;
      } else {
        const p = w === T.RIVER ? bio.river : bio.lake,
          a = rgb(p.a),
          bb = rgb(p.b),
          cc = rgb(p.c);
        tones = [a, lerp(a, bb, 0.5), bb, lerp(bb, cc, 0.3)];
        glints = [p.c, '#ffffff'];
        speed = w === T.RIVER ? 2.4 : 0.6;
        streak = w === T.RIVER ? 2.4 : 1.4;
      }
      for (let y = 0; y < Pw; y += 2)
        for (let x = 0; x < Pw; x += 2) {
          const n =
              pv(x, y * streak, 4, 271 + w) * 0.55 +
              pv(x, y, 8, 272 + w) * 0.3 +
              pv(x, y, 32, 273 + w) * 0.15,
            dither = ((x >> 1) + (y >> 1)) & 1 ? 0.025 : -0.025,
            k = Math.max(0, Math.min(3, Math.floor((n + dither - 0.28) * 7))),
            col2 = tones[k];
          for (let q = 0; q < 4; q++) {
            const o = ((y + (q >> 1)) * Pw + x + (q & 1)) * 4;
            d[o] = col2[0];
            d[o + 1] = col2[1];
            d[o + 2] = col2[2];
            d[o + 3] = 255;
          }
        }
      bg.putImageData(img, 0, 0);
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          if (ih(i, j, 274 + w) > (deepOf(w) ? 0.25 : 0.5)) continue;
          const x = (i * 16 + Math.floor(ih(j, i, 275) * 12)) % Pw,
            y = (j * 16 + Math.floor(ih(i, j, 276) * 12)) % Pw,
            len = (deepOf(w) ? 2 : 4) + Math.floor(ih(i, j, 277) * 4) * 2 * streak;
          gg.fillStyle = deepOf(w) ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,.35)';
          gg.fillRect(x + 2, y + 2, len - 2, 2);
          gg.fillStyle = glints[ih(i, j, 278) > 0.7 ? 1 : 0];
          gg.fillRect(x, y, len, 2);
          if (x + len > Pw) gg.fillRect(x - Pw, y, len, 2);
        }
      const pat = {
        base: c.createPattern(base, 'repeat'),
        glint: c.createPattern(glint, 'repeat'),
        speed,
        w
      };
      LIQ.set(key, pat);
      return pat;
    }
    const MAT = typeof DOMMatrix !== 'undefined' ? new DOMMatrix() : null;
    function fillLiquid(c, w, b, X, Y, wd, hg) {
      const pat = liquidPatterns(c, w, b);
      if (!pat) return;
      const k = pat.speed;
      MAT.e = Math.round(time * 0.05 * k);
      MAT.f = Math.round(Math.sin(time * 0.004) * 6);
      pat.base.setTransform(MAT);
      c.fillStyle = pat.base;
      c.fillRect(X, Y, wd, hg);
      MAT.e = Math.round(time * 0.16 * k);
      MAT.f = Math.round(time * 0.03 * k);
      pat.glint.setTransform(MAT);
      c.globalAlpha = deepOf(w) ? 0.35 + 0.2 * Math.sin(time * 0.01) : 0.5 + 0.25 * Math.sin(time * 0.02);
      c.fillStyle = pat.glint;
      c.fillRect(X, Y, wd, hg);
      c.globalAlpha = 1;
    }

    // ---------------------------------------------------------------- Blocs gardés et rendu
    let chunks = new Map(),
      chunkFor = null,
      ahead = null,
      queued = false;
    function fresh() {
      if (chunkFor !== key()) {
        chunks = new Map();
        chunkFor = key();
        underFor = null;
        work = new Map();
        stale.clear();
      }
    }
    // Bloc (cx, cy) : gardé, ou peint maintenant (deadline : s'arrête à l'heure dite et renvoie null, la peinture
    // reprendra où elle en était ; quelques blocs entamés sont gardés en cours).
    let work = new Map();
    function chunkAt(cx, cy, deadline) {
      fresh();
      const id = cy * 64 + cx;
      let img = chunks.get(id);
      if (img) {
        chunks.delete(id);
        chunks.set(id, img);
        return img;
      }
      let job = work.get(id);
      if (!job || job.of !== chunkFor) {
        job = { of: chunkFor, it: paintChunk(cx, cy) };
        work.set(id, job);
        if (work.size > 4) work.delete(work.keys().next().value);
      }
      let step;
      do step = job.it.next();
      while (!step.done && step.value === null && !(deadline && performance.now() > deadline));
      if (!step.done) return null;
      work.delete(id);
      img = step.value;
      if (!img) return null;
      img.addEventListener?.('contextlost', release);
      chunks.set(id, img);
      if (chunks.size > KEEP) chunks.delete(chunks.keys().next().value);
      return img;
    }
    function prepare(deadline) {
      queued = false;
      if (!ahead || !live()) return;
      const { cx0, cx1, cy0, cy1 } = ahead,
        mx = (cx0 + cx1) / 2,
        my = (cy0 + cy1) / 2,
        todo = [];
      for (let cy = Math.max(0, cy0 - 1); cy <= Math.min(Math.floor((MAPH - 1) / CH), cy1 + 1); cy++)
        for (let cx = Math.max(0, cx0 - 1); cx <= Math.min(Math.floor((MAPW - 1) / CH), cx1 + 1); cx++)
          if (!chunks.has(cy * 64 + cx)) todo.push([Math.hypot(cx - mx, cy - my), cx, cy]);
      if (!todo.length) return;
      todo.sort((a, b) => a[0] - b[0]);
      const end = performance.now() + Math.max(2, Math.min(8, (deadline?.timeRemaining?.() ?? 6) - 1));
      chunkAt(todo[0][1], todo[0][2], end);
      queue();
    }
    function queue() {
      if (queued) return;
      queued = true;
      if (typeof requestIdleCallback === 'function') requestIdleCallback(prepare, { timeout: 400 });
      else setTimeout(prepare, 30);
    }
    // Cases (x0, y0)-(x1, y1) changées (passage secret ouvert) : les blocs qui les touchent (avec la marge des bords
    // et des faces de falaise) seront repeints ; l'ancienne image reste affichée jusque-là.
    const stale = new Map();
    function forget(x0, y0, x1, y1) {
      fresh();
      underFor = null;
      axesFor = null;
      for (let cy = Math.floor((y0 - 9) / CH); cy <= Math.floor((y1 + 3) / CH); cy++)
        for (let cx = Math.floor((x0 - 3) / CH); cx <= Math.floor((x1 + 3) / CH); cx++) {
          const id = cy * 64 + cx;
          if (chunks.has(id)) stale.set(id, chunks.get(id));
          chunks.delete(id);
          work.delete(id);
        }
    }
    function release() {
      stale.clear();
      if (chunks.size) chunks = new Map();
      ahead = null;
      work = new Map();
      born.clear();
    }
    // Sol des Tréfonds : eaux animées dessous, blocs de sol, bulles de boue. Faux si le rendu est indisponible.
    // Les blocs visibles pas encore peints le sont dans un budget de temps par image (le plus proche du centre
    // d'abord) : à l'arrivée, le sol apparaît en fondu en quelques images au lieu de figer le jeu. Un bloc absent
    // reste dans le noir, sous ses eaux.
    const BUDGET = 10,
      FADE = 9,
      born = new Map();
    function drawGround(c, x0, x1, y0, y1) {
      if (!active()) return false;
      fresh();
      const start = performance.now(),
        cx0 = Math.floor(x0 / CH),
        cx1 = Math.floor((x1 - 1) / CH),
        cy0 = Math.floor(y0 / CH),
        cy1 = Math.floor((y1 - 1) / CH),
        mx = (x0 + x1) / 2 / CH - 0.5,
        my = (y0 + y1) / 2 / CH - 0.5,
        list = [];
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) list.push([Math.hypot(cx - mx, cy - my), cx, cy]);
      list.sort((a, b) => a[0] - b[0]);
      const ready = new Map();
      for (const [, cx, cy] of list) {
        const id = cy * 64 + cx;
        let img = chunks.has(id) ? chunkAt(cx, cy) : null;
        if (!img && performance.now() - start < BUDGET) {
          img = chunkAt(cx, cy, start + BUDGET);
          if (img && !stale.delete(id)) born.set(id, time);
        }
        if (!img && stale.has(id)) img = stale.get(id);
        if (img) ready.set(id, img);
      }
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1;) {
          const w = liquidUnder(x, y);
          if (w < 0) {
            x++;
            continue;
          }
          const b = biomeAt(x, y) % 4;
          let end = x + 1;
          while (end < x1 && liquidUnder(end, y) === w && biomeAt(end, y) % 4 === b) end++;
          fillLiquid(c, w, b, x * S, y * S, (end - x) * S, S);
          x = end;
        }
      const m = c.getTransform?.(),
        sx = m ? m.e : 0,
        sy = m ? m.f : 0;
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const id = cy * 64 + cx,
            img = ready.get(id),
            X = Math.round(cx * CH * S + sx) - sx,
            Y = Math.round(cy * CH * S + sy) - sy;
          if (!img) {
            c.fillStyle = '#050407';
            c.fillRect(X, Y, CH * S, CH * S);
            continue;
          }
          const age = born.has(id) ? time - born.get(id) : FADE;
          if (age >= FADE) {
            born.delete(id);
            c.drawImage(img, X, Y);
            continue;
          }
          c.fillStyle = '#050407';
          c.fillRect(X, Y, CH * S, CH * S);
          c.globalAlpha = Math.max(0.15, age / FADE);
          c.drawImage(img, X, Y);
          c.globalAlpha = 1;
        }
      ahead = { cx0, cx1, cy0, cy1 };
      queue();
      // Bulles qui crèvent à la surface de la boue.
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const t = at(x, y);
          if (t !== T.MUD && t !== T.RIVER) continue;
          const ph = Math.floor(time / 30),
            h = ih(x, y + ph * 131, 311);
          if (h < 0.86) continue;
          const r = 2 + (time % 30) / 7,
            bx = x * S + 8 + ih(y, x, 312 + ph) * 32,
            by = y * S + 8 + ih(x, y, 313 + ph) * 32;
          c.strokeStyle = (BIOMES[biomeAt(x, y) % 4] || BIOMES[0]).mud.c;
          c.globalAlpha = 1 - (time % 30) / 30;
          c.lineWidth = 2;
          c.strokeRect(Math.round(bx - r), Math.round(by - r * 0.6), Math.round(r * 2), Math.round(r * 1.2));
          c.globalAlpha = 1;
        }
      return true;
    }
    return { drawGround, forget, release, active };
  }
  window.CANAAN_UNDER_LOOK = Object.freeze({ create });
})();
