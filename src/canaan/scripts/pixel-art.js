// CANAAN PIXEL ART — sprites mis en cache (aucun rendu procédural coûteux par case/frame).
(() => {
  const PIXEL_TERRAIN = [],
    PIXEL_DECOR = {};
  function pixHash(x, y, k = 0) {
    let z = Math.sin(x * 127.1 + y * 311.7 + k * 73.3) * 43758.5453;
    return z - Math.floor(z);
  }
  function pixCanvas(w, h) {
    let c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  // Feuillage en pixels : grappes rondes empilées, ombrées en quatre tons, et feuilles éparses sur le pourtour.
  function pixDisc(g, cx, cy, r, col) {
    g.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1);
    }
  }
  function pixCanopy(g, cx, cy, rx, ry, pal, seed, clusters = 15) {
    const spots = [];
    for (let k = 0; k < clusters; k++) {
      const a = pixHash(k, seed, 1) * Math.PI * 2,
        d = Math.sqrt(pixHash(seed, k, 2));
      spots.push([
        cx + Math.cos(a) * rx * d * 0.78,
        cy + Math.sin(a) * ry * d * 0.78,
        5 + Math.floor(pixHash(k, k, seed) * 5)
      ]);
    }
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of spots) pixDisc(g, x + 1, y + 2, r + 1, pal[0]);
    for (const [x, y, r] of spots) pixDisc(g, x, y, r, pal[1]);
    for (const [x, y, r] of spots)
      if (y < cy + ry * 0.3) pixDisc(g, x - 1, y - 2, Math.max(2, r - 2), pal[2]);
    for (const [x, y, r] of spots) if (y < cy) pixDisc(g, x - 2, y - 3, Math.max(1, r - 4), pal[3]);
    for (let k = 0; k < 26; k++) {
      const a = pixHash(k, seed, 7) * Math.PI * 2,
        d = 0.55 + pixHash(seed, k, 8) * 0.5,
        x = Math.round(cx + Math.cos(a) * rx * d),
        y = Math.round(cy + Math.sin(a) * ry * d);
      g.fillStyle = k % 3 ? pal[k % 2 ? 2 : 1] : pal[0];
      g.fillRect(x, y, 2, 2);
    }
    if (pal[4])
      for (let k = 0; k < 5; k++) {
        g.fillStyle = pal[4];
        g.fillRect(
          Math.round(cx - rx * 0.6 + pixHash(k, seed, 9) * rx * 1.2),
          Math.round(cy - ry * 0.5 + pixHash(seed, k, 9) * ry),
          3,
          3
        );
      }
  }
  function pixTrunk(g, x, top, bottom, w, bark, dark, light) {
    g.fillStyle = bark;
    g.fillRect(x - w / 2, top, w, bottom - top);
    g.fillStyle = dark;
    g.fillRect(x + w / 2 - 2, top, 2, bottom - top);
    g.fillRect(x - w / 2 - 3, bottom - 4, 4, 4);
    g.fillRect(x + w / 2 - 1, bottom - 3, 4, 3);
    g.fillStyle = light;
    g.fillRect(x - w / 2 + 1, top + 2, 1, bottom - top - 6);
    for (let k = top + 4; k < bottom - 4; k += 6) {
      g.fillStyle = dark;
      g.fillRect(x - 1 + ((k / 6) % 2) * 2, k, 2, 3);
    }
  }
  function drawPixDecor(type) {
    let c = pixCanvas(64, 76),
      g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const R = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    R(12, 62, 40, 5, '#24362b55');
    if (type === 'tree') {
      pixTrunk(g, 32, 38, 66, 8, '#654b35', '#45311f', '#8c6a48');
      pixCanopy(g, 32, 26, 25, 21, ['#1c4a2e', '#2e6a3e', '#4a8c4c', '#86c062'], 3);
    } else if (type === 'pine' || type === 'snowpine') {
      pixTrunk(g, 32, 50, 66, 6, '#5a4130', '#3e2c1e', '#7a5a40');
      const tones =
        type === 'snowpine'
          ? ['#7a9a96', '#b5cfcb', '#e6eeeb', '#ffffff']
          : ['#163c30', '#21503e', '#34735a', '#5a9a74'];
      for (let j = 0; j < 4; j++) {
        const y = 6 + j * 11,
          half = 8 + j * 5;
        for (let row = 0; row < 14; row++) {
          const w = Math.round((half * (row + 2)) / 15) + ((row + j) % 3 === 0 ? 2 : 0);
          g.fillStyle = tones[0];
          g.fillRect(32 - w + 1, y + row + 1, w * 2, 1);
          g.fillStyle = tones[1];
          g.fillRect(32 - w, y + row, w * 2 - 2, 1);
          g.fillStyle = tones[2];
          g.fillRect(32 - w, y + row, Math.max(1, w - 2), 1);
        }
        g.fillStyle = tones[3];
        g.fillRect(32 - half / 2, y + 4, 3, 2);
      }
    } else if (type === 'palm') {
      pixTrunk(g, 34, 22, 66, 6, '#7b5a36', '#5a4024', '#a07a4a');
      for (let k = 22; k < 64; k += 5) {
        g.fillStyle = '#5a4024';
        g.fillRect(31, k, 7, 1);
      }
      for (let j = 0; j < 7; j++) {
        const a = -Math.PI + (j / 6) * Math.PI,
          len = 22;
        for (let t = 0; t < len; t++) {
          const x = 34 + Math.cos(a) * t,
            y = 20 + Math.sin(a) * t * 0.55 + (t * t) / 40;
          g.fillStyle = t % 4 === 0 ? '#2e6a3e' : '#43834d';
          g.fillRect(Math.round(x), Math.round(y), 3, 3);
          g.fillStyle = '#6aa85a';
          g.fillRect(Math.round(x), Math.round(y) - 1, 2, 1);
        }
      }
      pixDisc(g, 33, 23, 3, '#8a5a2a');
      pixDisc(g, 37, 24, 3, '#6e4420');
    } else if (type === 'deadwood') {
      R(29, 37, 7, 31, '#594d49');
      R(32, 42, 3, 20, '#7a6a64');
      R(16, 28, 20, 5, '#594d49');
      R(35, 20, 5, 25, '#594d49');
    } else if (type === 'rock' || type === 'peak') {
      R(15, 48, 36, 17, '#56646c');
      R(19, 38, 28, 13, '#89999b');
      R(23, 34, 15, 10, '#bdc8bc');
      R(17, 57, 30, 5, '#434c53');
    } else if (type === 'flower' || type === 'bush') {
      for (let j = 0; j < 7; j++) {
        let x = 9 + ((j * 13) % 46),
          y = 46 + ((j * 9) % 15);
        R(x, y, 4, 13, '#467b46');
        R(x - 4, y, 11, 6, type === 'bush' ? '#3c8249' : ['#e9b0c9', '#f3d786', '#d3b4ee', '#e5edf1'][j % 4]);
        R(x, y + 1, 3, 3, '#f7e7aa');
      }
    } else if (type === 'cactus') {
      R(29, 25, 9, 39, '#387f55');
      R(21, 39, 8, 8, '#387f55');
      R(17, 30, 6, 16, '#438b5e');
      R(38, 35, 8, 7, '#387f55');
      R(42, 25, 6, 16, '#438b5e');
    } else if (type === 'crystal') {
      R(26, 20, 15, 41, '#5e8fa8');
      R(29, 14, 8, 36, '#9ce2e6');
      R(32, 20, 4, 27, '#e3f8f3');
    } else if (type === 'mushroom') {
      R(29, 42, 9, 19, '#e8d9bb');
      R(17, 33, 32, 13, '#a75c8a');
      R(23, 29, 19, 8, '#d883a9');
      R(25, 35, 5, 4, '#f6e8dd');
    } else if (type === 'reed') {
      for (let j = 0; j < 6; j++) {
        let x = 12 + j * 8;
        R(x, 37 + (j % 3) * 5, 3, 26, '#78a36b');
        R(x, 31 + (j % 3) * 5, 4, 11, '#b3a96b');
      }
    } else if (type === 'bigtree') {
      // Arbre ancien : tronc large et racines, couronne immense et profonde.
      pixTrunk(g, 32, 36, 68, 14, '#4f3a2a', '#36261a', '#6e5139');
      R(16, 62, 10, 6, '#4f3a2a');
      R(40, 62, 10, 6, '#4f3a2a');
      pixCanopy(g, 32, 22, 31, 22, ['#123622', '#1d4a30', '#2e6a40', '#5a9a58'], 11, 22);
    } else if (type === 'twisted') {
      // Arbre tordu du marais : tronc sinueux, branches nues, touffes rares et mousse pendante.
      R(28, 46, 8, 20, '#4a4038');
      R(24, 34, 8, 14, '#4a4038');
      R(30, 22, 7, 14, '#4a4038');
      R(14, 26, 12, 5, '#4a4038');
      R(10, 20, 5, 8, '#4a4038');
      R(36, 18, 14, 5, '#4a4038');
      R(48, 12, 5, 8, '#4a4038');
      R(26, 36, 2, 10, '#6a5a50');
      pixCanopy(g, 22, 16, 10, 6, ['#2e3e2a', '#4f6b4a', '#6a8a5a', '#8aa870'], 21, 6);
      pixCanopy(g, 46, 10, 9, 5, ['#2e3e2a', '#4f6b4a', '#6a8a5a', '#8aa870'], 22, 5);
      for (const [x, y, l] of [
        [12, 26, 12],
        [18, 28, 8],
        [44, 20, 14],
        [50, 18, 9],
        [33, 34, 10]
      ]) {
        R(x, y, 2, l, '#7a8a5a');
        R(x + 2, y + 2, 1, l - 4, '#9aaa70');
      }
    } else if (type === 'lilypad') {
      R(14, 52, 18, 8, '#3f8a4a');
      R(18, 50, 10, 3, '#5aa75c');
      R(36, 58, 14, 6, '#3f8a4a');
      R(22, 48, 5, 4, '#f4c6dc');
    } else if (type === 'autumn_red' || type === 'autumn_orange' || type === 'autumn_gold') {
      const pal = {
        autumn_red: ['#5a1a16', '#8d2a22', '#c4402e', '#ee7a50'],
        autumn_orange: ['#6a3412', '#a8561e', '#d8802c', '#f8b45a'],
        autumn_gold: ['#6a4a12', '#a8801e', '#dcb236', '#fbe27a']
      }[type];
      pixTrunk(g, 32, 38, 66, 8, '#5e4330', '#3e2c1e', '#8a6648');
      pixCanopy(g, 32, 26, 25, 20, pal, type.length * 5);
      for (let j = 0; j < 6; j++) R(10 + ((j * 13) % 44), 62 + (j % 3), 4, 3, pal[1 + (j % 3)]);
    } else if (type === 'leafpile') {
      for (let j = 0; j < 9; j++)
        R(14 + ((j * 11) % 34), 54 + ((j * 7) % 9), 7, 4, ['#d9542f', '#e98a2c', '#efc145'][j % 3]);
    } else if (type === 'dune') {
      R(6, 56, 52, 8, '#c49a5e');
      R(14, 50, 36, 8, '#dcb878');
      R(22, 46, 18, 5, '#ecd096');
    } else if (type === 'glowtree') {
      // Arbre lumineux : écorce pâle, feuillage turquoise et fruits brillants.
      pixTrunk(g, 32, 38, 66, 8, '#8c8fb8', '#5e608a', '#c3c6e8');
      pixCanopy(g, 32, 26, 25, 20, ['#1e6a6a', '#2e8f8a', '#4fc0b0', '#9ff4e4', '#f6d8ff'], 17);
    } else if (type === 'magicplant') {
      for (let j = 0; j < 4; j++) {
        const x = 14 + j * 11;
        R(x, 44 + (j % 2) * 6, 3, 18, '#3c9a80');
        R(x - 3, 38 + (j % 2) * 6, 9, 8, j % 2 ? '#c99bff' : '#7ff0dc');
        R(x - 1, 40 + (j % 2) * 6, 4, 3, '#ffffff');
      }
    } else if (type === 'ruin') {
      // Colonne de grès brisée et blocs tombés.
      R(10, 62, 44, 5, '#4a3a2455');
      R(22, 20, 18, 44, '#c9a673');
      R(22, 20, 5, 44, '#e3c48f');
      R(36, 20, 4, 44, '#a2814f');
      R(18, 14, 26, 8, '#b8935e');
      R(24, 32, 14, 2, '#a2814f');
      R(24, 46, 14, 2, '#a2814f');
      R(42, 54, 14, 10, '#b8935e');
      R(8, 56, 12, 8, '#c9a673');
    } else if (type === 'lava') {
      R(14, 46, 37, 13, '#a33d2c');
      R(20, 49, 22, 7, '#e88737');
      R(26, 50, 10, 5, '#f6c36b');
    }
    PIXEL_DECOR[type] = c;
  }
  for (const type of [
    'tree',
    'pine',
    'snowpine',
    'palm',
    'deadwood',
    'rock',
    'peak',
    'flower',
    'bush',
    'cactus',
    'crystal',
    'mushroom',
    'reed',
    'lava',
    'bigtree',
    'twisted',
    'lilypad',
    'autumn_red',
    'autumn_orange',
    'autumn_gold',
    'leafpile',
    'dune',
    'glowtree',
    'magicplant',
    'ruin'
  ])
    drawPixDecor(type);
  const CANAAN_HERO_SPRITES = new Map();
  // Teinte plus sombre (f < 1) ou plus claire (f > 1) d'une couleur #rrggbb.
  function tint(hex, f) {
    const n = parseInt(hex.slice(1), 16),
      ch = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
  }
  // Héros en pixels 24x30 (dessiné à l'échelle 2) selon son apparence (voir shared/data/looks.js),
  // sa direction (0 face, 1 droite, 2 dos, 3 gauche) et son pas de marche.
  // opts.tool : objet tenu à la place de l'épée (PNJ) : 'spear', 'staff', 'rod', 'basket' ou 'none'.
  function drawHeroArt(c, face, step, rawLook, opts = {}) {
    const look = typeof sanitizeLook === 'function' ? sanitizeLook(rawLook) : rawLook || {};
    const outfit = typeof lookOutfit === 'function' ? lookOutfit(look.outfit) : null;
    const [armorD, armorM, armorL] = outfit ? outfit.armor : ['#3e526e', '#4b617e', '#7a93aa'],
      [capeD, capeM, capeL] = outfit ? outfit.cape : ['#292d53', '#4b447e', '#6a62a0'],
      trim = outfit ? outfit.trim : '#b9a66d';
    const skin = look.skin || '#f0c7a0',
      skinD = tint(skin, 0.82),
      skinL = tint(skin, 1.12),
      hair = look.hair || '#7d5140',
      hairD = tint(hair, 0.7),
      hairL = tint(hair, 1.25),
      eyes = look.eyes || '#202938';
    const female = look.sex === 'f',
      race = look.race || 'humain',
      orc = race === 'orc',
      elf = race === 'elfe',
      bull = race === 'minotaure',
      broad = orc || bull;
    const R = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    c.save();
    c.scale(2, 2);
    const walk = step === 1 ? 2 : step === 3 ? -2 : 0,
      back = face === 2,
      side = face === 1 || face === 3,
      right = face === 1;
    // Ombre, jambes et bottes.
    R(5, 27, 15, 2, '#0a182055');
    R(8, 21 + walk, 4, 6, tint(armorD, 0.7));
    R(14, 21 - walk, 4, 6, tint(armorD, 0.7));
    R(7, 25 + walk, 6, 3, bull ? '#2a2420' : '#24202d');
    R(13, 25 - walk, 6, 3, bull ? '#2a2420' : '#24202d');
    R(7, 24 + walk, 5, 1, armorL);
    R(14, 24 - walk, 4, 1, armorL);
    // Cape longue, plis et bord.
    R(6, 12, 13, 12, capeD);
    R(7, 14, 11, 11, capeM);
    R(8, 16, 2, 8, capeL);
    R(15, 16, 2, 8, tint(capeD, 0.85));
    // Torse : plus fin pour une héroïne, plus large pour un orc ou un minotaure.
    const tx = female ? 8 : broad ? 6 : 7,
      tw = female ? 9 : broad ? 13 : 11;
    R(tx, 12, tw, 9, armorM);
    R(tx + 1, 13, tw - 2, 7, armorL);
    R(tx + 2, 14, tw - 4, 5, armorD);
    R(tx, 12, female ? 2 : 3, 8, trim);
    R(tx + tw - (female ? 2 : 3), 12, female ? 2 : 3, 8, trim);
    R(9, 19, 8, 2, '#312a34');
    R(12, 19, 2, 2, tint(trim, 1.2));
    if (female && !back) R(11, 15, 4, 1, tint(armorL, 1.15));
    // Bras, épaulières et mains (couleur de peau).
    const ax = broad ? 3 : female ? 5 : 4,
      bx = broad ? 19 : female ? 17 : 18,
      pw = broad ? 6 : female ? 4 : 5;
    R(ax, 12 + walk / 2, 4, 8, armorD);
    R(bx, 12 - walk / 2, 4, 8, armorD);
    R(ax - (broad ? 1 : 0) - (pw === 5 ? 1 : 0), 12 + walk / 2, pw, 4, armorL);
    R(bx, 12 - walk / 2, pw, 4, armorL);
    R(ax, 19 + walk / 2, 4, 3, skinD);
    R(bx, 19 - walk / 2, 4, 3, skinD);
    R(ax + 1, 19 + walk / 2, 2, 2, skin);
    R(bx + 1, 19 - walk / 2, 2, 2, skin);
    R(ax, 13 + walk / 2, 2, 2, tint(armorL, 1.3));
    R(bx + 2, 13 - walk / 2, 2, 2, tint(armorL, 1.3));
    // Oreilles d'elfe (longues et pointues) et d'orc (courtes) ; oreilles et cornes du minotaure.
    if (elf && !back) {
      if (!side || !right) {
        R(7, 8, 2, 2, skin);
        R(5, 6, 2, 2, skin);
        R(6, 7, 1, 1, skinD);
      }
      if (!side || right) {
        R(18, 8, 2, 2, skin);
        R(20, 6, 2, 2, skin);
        R(20, 7, 1, 1, skinD);
      }
    }
    if (orc) {
      R(7, 8, 2, 2, skinD);
      R(18, 8, 2, 2, skinD);
    }
    if (bull) {
      R(5, 8, 3, 2, skinD);
      R(19, 8, 3, 2, skinD);
      // Cornes ivoire recourbées vers le haut, pointes sombres.
      R(5, 5, 4, 2, '#e8dcc0');
      R(4, 3, 2, 3, '#e8dcc0');
      R(3, 2, 2, 2, '#d8ccb0');
      R(3, 1, 1, 1, '#8a7a60');
      R(18, 5, 4, 2, '#e8dcc0');
      R(21, 3, 2, 3, '#e8dcc0');
      R(22, 2, 2, 2, '#d8ccb0');
      R(23, 1, 1, 1, '#8a7a60');
    }
    // Tête : crâne et visage.
    const hx = bull ? 8 : 9,
      hw = bull ? 11 : 9;
    R(hx, 5, hw, 8, skinD);
    if (back) {
      R(hx, 6, hw, 7, skinD);
    } else {
      R(bull ? 9 : 10, 7, bull ? 9 : 7, 6, skin);
      R(bull ? 10 : 11, 8, bull ? 7 : 5, 4, skinL);
      if (bull) {
        // Mufle clair, naseaux et anneau.
        const mx = side ? (right ? 14 : 9) : 11;
        R(mx, 10, side ? 5 : 5, 3, tint(skin, 1.3));
        R(mx + 1, 11, 1, 1, '#2a1a14');
        R(mx + 3, 11, 1, 1, '#2a1a14');
        R(mx + 2, 13, 1, 1, '#e0c060');
      }
      if (!side) {
        R(11, 10, 1, 1, eyes);
        R(16, 10, 1, 1, eyes);
        if (female) {
          R(10, 9, 2, 1, hairD);
          R(16, 9, 2, 1, hairD);
        } else if (orc || bull) {
          R(10, 9, 3, 1, skinD);
          R(15, 9, 3, 1, skinD);
        }
        if (!bull) R(13, 12, 2, 1, female ? '#c0505a' : tint(skin, 0.7));
        if (orc) {
          R(11, 12, 1, 2, '#f4f0dc');
          R(16, 12, 1, 2, '#f4f0dc');
        }
      } else {
        R(right ? 16 : 11, 10, 1, 1, eyes);
        if (orc) R(right ? 16 : 11, 12, 1, 2, '#f4f0dc');
        if (female) R(right ? 15 : 11, 9, 2, 1, hairD);
      }
    }
    // Coiffure.
    const style = look.hairStyle || 'court';
    const cap = () => {
      R(9, 4, 9, 3, hair);
      R(8, 5, 11, 2, hair);
      R(10, 4, 5, 1, hairL);
    };
    if (style === 'rase') {
      R(9, 5, 9, 2, tint(skin, 0.75));
    } else if (style === 'crete') {
      R(9, 5, 9, 2, tint(skin, 0.75));
      R(12, 1, 3, 6, hair);
      R(13, 1, 1, 5, hairL);
      if (back) R(12, 7, 3, 4, hair);
    } else {
      cap();
      if (back) {
        R(8, 5, 11, 8, hair);
        R(9, 6, 9, 6, hairD);
        R(10, 6, 2, 5, hair);
      } else if (side) {
        // La chevelure couvre l'arrière de la tête.
        R(right ? 8 : 15, 5, 4, 7, hair);
        R(right ? 8 : 17, 7, 2, 5, hairD);
      } else {
        R(9, 7, 1, female ? 3 : 2, hair);
        R(17, 7, 1, female ? 3 : 2, hair);
      }
      if (style === 'long') {
        if (back) R(8, 11, 11, 5, hair);
        else if (side) R(right ? 8 : 16, 11, 3, 6, hair);
        else {
          R(8, 7, 2, 9, hair);
          R(17, 7, 2, 9, hair);
          R(8, 12, 1, 4, hairD);
          R(18, 12, 1, 4, hairD);
        }
      } else if (style === 'queue') {
        if (back) {
          R(12, 11, 3, 7, hair);
          R(12, 11, 3, 1, tint(trim, 1));
          R(13, 13, 1, 4, hairL);
        } else if (side) {
          R(right ? 6 : 19, 7, 2, 7, hair);
          R(right ? 7 : 18, 7, 2, 1, trim);
        }
      } else if (style === 'tresses') {
        const braid = (x, top) => {
          for (let k = 0; k < 8; k++) R(x, top + k, 2, 1, k % 2 ? hairD : hair);
          R(x, top + 8, 2, 1, trim);
        };
        if (back) {
          braid(10, 11);
          braid(15, 11);
        } else if (side) braid(right ? 9 : 16, 8);
        else {
          braid(8, 8);
          braid(17, 8);
        }
      }
    }
    const sx = face === 3 ? 2 : 21,
      tool = opts.tool || 'sword';
    if (tool === 'sword') {
      // Épée : silhouette, garde, poignée et reflet.
      R(sx, 8, 2, 13, '#899dab');
      R(sx, 7, 2, 7, '#dcebf0');
      R(sx - 2, 19, 6, 2, '#d3b56b');
      R(sx, 21, 2, 4, '#543b35');
      R(sx, 7, 1, 9, '#ffffff88');
    } else if (tool === 'spear') {
      R(sx, 2, 1, 24, '#6a4a30');
      R(sx - 1, 0, 3, 3, '#c8d0d8');
      R(sx, -1, 1, 1, '#eef4f8');
    } else if (tool === 'staff') {
      R(sx, 5, 2, 21, '#6a4a30');
      R(sx - 1, 3, 4, 3, '#8a6a48');
      R(sx, 2, 2, 2, '#9ff4e4');
    } else if (tool === 'rod') {
      R(sx, 6, 1, 18, '#8a6a48');
      R(face === 3 ? sx - 4 : sx + 1, 4, 4, 1, '#8a6a48');
      R(face === 3 ? sx - 4 : sx + 4, 5, 1, 8, '#e8e8e0aa');
    } else if (tool === 'basket') {
      R(sx - 1, 18, 5, 4, '#a8803e');
      R(sx - 1, 18, 5, 1, '#c8a050');
      R(sx, 16, 3, 2, '#a8803e');
      R(sx, 17, 1, 1, '#e05a3a');
      R(sx + 2, 17, 1, 1, '#f0c040');
    }
    c.restore();
  }
  // Sprite détouré d'un héros, mis en cache par apparence, direction et pas.
  function canaanHeroSprite(look, face, frame, opts = {}) {
    const code = typeof encodeLook === 'function' ? encodeLook(look) : 'defaut',
      key = code + ':' + face + ':' + frame + ':' + (opts.tool || 'sword');
    let spr = CANAAN_HERO_SPRITES.get(key);
    if (!spr) {
      spr = document.createElement('canvas');
      spr.width = 48;
      spr.height = 60;
      drawHeroArt(spr.getContext('2d'), face, frame, look, opts);
      spr = canaanOutline(spr, 2);
      // Cache borné : quelques apparences à la fois (groupe de quatre, aperçu de création).
      if (CANAAN_HERO_SPRITES.size > 400) CANAAN_HERO_SPRITES.clear();
      CANAAN_HERO_SPRITES.set(key, spr);
    }
    return spr;
  }
  // Forme féline du Druide : panthère de la forêt en pixels 24x30 (échelle 2), pelage sombre aux marques de sève.
  // face : 0 face, 1 droite, 2 dos, 3 gauche (miroir de la droite) ; step : pas de course.
  function drawFeralArt(c, face, step) {
    const R = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    const D = '#1f2a24',
      M = '#2f4036',
      L = '#4a6352',
      G = '#7ee36a',
      E = '#e6ff8a',
      run = step === 1 ? 1 : step === 3 ? -1 : 0;
    c.save();
    if (face === 3) {
      c.translate(48, 0);
      c.scale(-1, 1);
    }
    c.scale(2, 2);
    R(2, 27, 20, 2, '#0a182055');
    if (face === 1 || face === 3) {
      // Profil : longue queue recourbée, corps bas et allongé, pattes fines en course, tête aux oreilles pointues.
      R(0, 9 - run, 1, 4, M);
      R(1, 12 - run, 1, 3, M);
      R(2, 14, 1, 2, M);
      R(3, 15, 1, 2, D);
      R(4, 15, 13, 5, M);
      R(5, 15, 11, 1, L);
      R(4, 19, 13, 1, D);
      R(6, 17, 1, 1, G);
      R(9, 16, 1, 1, G);
      R(11, 18, 1, 1, G);
      R(14, 16, 1, 1, G);
      R(5, 20, 2, 5 + run, D);
      R(8, 20, 1, 5 - run, M);
      R(13, 20, 1, 5 - run, D);
      R(15, 20, 2, 5 + run, M);
      R(4, 25 + run, 3, 1, D);
      R(15, 25 + run, 3, 1, L);
      R(16, 13, 2, 3, M);
      R(17, 11, 5, 5, M);
      R(18, 11, 3, 1, L);
      R(17, 9, 1, 2, D);
      R(18, 10, 1, 1, D);
      R(20, 9, 1, 2, D);
      R(21, 10, 1, 1, D);
      R(17, 10, 1, 1, G);
      R(21, 13, 2, 2, L);
      R(23, 13, 1, 1, '#2a1a1a');
      R(19, 12, 2, 1, E);
      R(20, 12, 1, 1, '#ffffff');
      R(21, 15, 2, 1, '#f4f4e8');
    } else if (face === 0) {
      // De face : tête fine aux oreilles pointues, yeux en amande, poitrail et queue enroulée sur le côté.
      R(17, 15, 1, 5, M);
      R(18, 19, 2, 1, M);
      R(8, 14, 8, 7, M);
      R(10, 15, 4, 5, L);
      R(11, 16, 2, 3, G);
      R(8, 20, 2, 6 + run, D);
      R(14, 20, 2, 6 - run, D);
      R(8, 25 + run, 2, 1, L);
      R(14, 25 - run, 2, 1, L);
      R(10, 21, 1, 4, M);
      R(13, 21, 1, 4, M);
      R(8, 6, 8, 8, M);
      R(9, 6, 6, 2, L);
      R(7, 4, 1, 3, D);
      R(8, 5, 1, 1, D);
      R(16, 4, 1, 3, D);
      R(15, 5, 1, 1, D);
      R(7, 5, 1, 1, G);
      R(16, 5, 1, 1, G);
      R(9, 9, 2, 1, E);
      R(13, 9, 2, 1, E);
      R(10, 9, 1, 1, '#ffffff');
      R(13, 9, 1, 1, '#ffffff');
      R(10, 11, 4, 3, L);
      R(11, 11, 2, 1, '#2a1a1a');
      R(10, 13, 1, 1, '#f4f4e8');
      R(13, 13, 1, 1, '#f4f4e8');
      R(6, 12, 2, 1, '#9aa69e');
      R(16, 12, 2, 1, '#9aa69e');
    } else {
      // De dos : échine marquée de sève, oreilles pointues et queue dressée.
      R(8, 13, 8, 8, M);
      R(9, 13, 6, 2, L);
      R(11, 14, 2, 6, G);
      R(8, 20, 2, 6 + run, D);
      R(14, 20, 2, 6 - run, D);
      R(11, 20, 2, 2, M);
      R(12, 22, 1, 3, M);
      R(13, 24, 2, 1, M);
      R(8, 6, 8, 7, M);
      R(9, 6, 6, 2, D);
      R(7, 4, 1, 3, D);
      R(8, 5, 1, 1, D);
      R(16, 4, 1, 3, D);
      R(15, 5, 1, 1, D);
      R(7, 5, 1, 1, G);
      R(16, 5, 1, 1, G);
    }
    c.restore();
  }
  function canaanFeralSprite(face, frame) {
    const key = 'feral:' + face + ':' + frame;
    let spr = CANAAN_HERO_SPRITES.get(key);
    if (!spr) {
      spr = document.createElement('canvas');
      spr.width = 48;
      spr.height = 60;
      drawFeralArt(spr.getContext('2d'), face, frame);
      spr = canaanOutline(spr, 2);
      CANAAN_HERO_SPRITES.set(key, spr);
    }
    return spr;
  }
  // body : le héros dessiné (l'hôte par défaut), pour son orientation et sa marche ; look : son apparence.
  // body.form === 'feral' : panthère du Druide ; body.veiled : Voile d'ombre (presque invisible).
  function drawPixelHero(c, x, y, color, phase, player, body = P, look = body === P ? game.hero?.look : null) {
    const dx = body.vx || 0,
      dy = body.vy || 0;
    const face = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 1 : 3) : dy < 0 ? 2 : 0;
    const moving = Math.abs(dx) + Math.abs(dy) > 0.1;
    // Pas plus doux : environ neuf images par seconde (anim avance de 0,25 par pas de simulation).
    const frame = moving ? Math.floor(Math.abs(phase) * 0.6) % 4 : 0;
    const feral = body.form === 'feral';
    const spr = feral ? canaanFeralSprite(face, frame) : canaanHeroSprite(look, face, frame);
    const bob = moving ? Math.round(Math.sin(phase * 0.6 * Math.PI) * 1.5) : 0;
    // Le minotaure est un peu plus grand.
    const scale = !feral && look?.race === 'minotaure' ? 1.1 : 1.0;
    c.save();
    if (body.veiled) c.globalAlpha *= 0.3;
    c.drawImage(spr, Math.round(x - 26 * scale), Math.round(y + 18 - 60 * scale + bob), Math.round(52 * scale), Math.round(64 * scale));
    c.restore();
  }
  // Ponts en planches hors des instances (les routes sont des tuiles texturées de canaan-world-look), dans le style
  // des donjons : planches en trois tons posées en travers de la route, joints et clous, garde-corps sur les bords
  // avec leurs poteaux, pilotis et ombre dans l'eau qu'on voit dessous, seuil plus sombre aux deux bouts.
  // Le sens de chaque case (le long de la route) est déduit une fois de la forme du pont, ou de ses appuis sur la terre
  // ferme pour les petits ponts carrés.
  const BRIDGE_WATER = {
    0: ['#1f5a80', '#2f7aa8', '#9fd4ea'],
    15: ['#2e6a60', '#3f8a7e', '#a8dcc8'],
    18: ['#24507a', '#3a6aa8', '#c8f0ff']
  };
  let bridgeAxis = new Map(),
    bridgeSeen = { size: -1, map: null };
  function bridgeAxes() {
    if (bridgeSeen.size === BRIDGE_TILES.size && bridgeSeen.map === game.world.overworld) return bridgeAxis;
    bridgeSeen = { size: BRIDGE_TILES.size, map: game.world.overworld };
    bridgeAxis = new Map();
    const tile = (x, y) => game.world.overworld[y]?.[x];
    const wet = (x, y) => [0, 15, 18].includes(tile(x, y)) && !BRIDGE_TILES.has(y * MAPW + x);
    for (const start of BRIDGE_TILES) {
      if (bridgeAxis.has(start)) continue;
      // Un pont d'un seul tenant : ses appuis à gauche et à droite contre ceux du haut et du bas.
      const part = [start],
        seen = new Set(part);
      let side = 0,
        ends = 0,
        x0 = Infinity,
        x1 = -Infinity,
        y0 = Infinity,
        y1 = -Infinity;
      for (let i = 0; i < part.length; i++) {
        const k = part[i],
          x = k % MAPW,
          y = (k - x) / MAPW;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nk = (y + dy) * MAPW + x + dx;
          if (BRIDGE_TILES.has(nk)) {
            if (!seen.has(nk)) {
              seen.add(nk);
              part.push(nk);
            }
          } else if (tile(x + dx, y + dy) !== undefined && !wet(x + dx, y + dy)) {
            if (dx) side++;
            else ends++;
          }
        }
      }
      const fallback = side > ends ? 'h' : side < ends ? 'v' : x1 - x0 > y1 - y0 ? 'h' : 'v';
      // Sens de chaque case : le pont s'étire le long de la route (longueur de la rangée contre celle de la colonne).
      for (const k of part) {
        const x = k % MAPW,
          y = (k - x) / MAPW;
        let row = 0,
          col = 0;
        for (let d = -3; d <= 3; d++) {
          if (BRIDGE_TILES.has(y * MAPW + x + d)) row++;
          if (BRIDGE_TILES.has((y + d) * MAPW + x)) col++;
        }
        if (row > col + 1 || col > row + 1) bridgeAxis.set(k, row > col ? 'h' : 'v');
      }
      // Cases des virages : le sens le plus courant autour d'elles.
      for (const k of part) {
        if (bridgeAxis.has(k)) continue;
        const x = k % MAPW,
          y = (k - x) / MAPW;
        let h = 0,
          v = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const a = bridgeAxis.get((y + dy) * MAPW + x + dx);
            if (a === 'h') h++;
            else if (a === 'v') v++;
          }
        bridgeAxis.set(k, h > v ? 'h' : v > h ? 'v' : fallback);
      }
    }
    return bridgeAxis;
  }
  function drawPixelRoads(c) {
    let x0 = Math.max(0, Math.floor(camX / TS) - 2),
      x1 = Math.min(MAPW, Math.ceil((camX + W) / TS) + 2),
      y0 = Math.max(0, Math.floor(camY / TS) - 2),
      y1 = Math.min(MAPH, Math.ceil((camY + H) / TS) + 2);
    if (game.world.instance) return;
    const axes = bridgeAxes(),
      tile = (x, y) => game.world.overworld[y]?.[x],
      isBridge = (x, y) => BRIDGE_TILES.has(y * MAPW + x),
      wet = (x, y) => [0, 15, 18].includes(tile(x, y)) && !isBridge(x, y),
      h = (x, y, k) => {
        const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
        return n - Math.floor(n);
      };
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        if (!isBridge(x, y)) continue;
        const px = x * TS,
          py = y * TS,
          along = axes.get(y * MAPW + x) || 'v',
          vert = along === 'v';
        // Repère local : u le long de la route, w en travers ; R(u, w, longueur, largeur).
        const R = (u, w, lu, lw, col) => {
          c.fillStyle = col;
          if (vert) c.fillRect(px + w, py + u, lw, lu);
          else c.fillRect(px + u, py + w, lu, lw);
        };
        const side = s => (vert ? isBridge(x + s, y) : isBridge(x, y + s)),
          end = s => (vert ? isBridge(x, y + s) || wet(x, y + s) : isBridge(x + s, y) || wet(x + s, y)),
          edgeA = !side(-1),
          edgeB = !side(1);
        // Eau sous le pont, de la couleur de l'eau voisine, avec un reflet qui passe.
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => tile(x + dx, y + dy)).find(t => BRIDGE_WATER[t]),
          water = BRIDGE_WATER[near] || BRIDGE_WATER[0];
        c.fillStyle = water[1];
        c.fillRect(px, py, TS, TS);
        const wa = edgeA ? 7 : 0,
          wb = edgeB ? TS - 7 : TS;
        c.globalAlpha = 0.6;
        const ripple = (time * 0.4 + x * 13 + y * 7) % TS;
        if (edgeA) R(ripple, 1, 8, 2, water[2]);
        if (edgeB) R((ripple + 20) % TS, TS - 3, 8, 2, water[2]);
        c.globalAlpha = 1;
        // Ombre du tablier et pilotis qui plongent dans l'eau.
        if (edgeA) {
          R(0, wa - 3, TS, 3, water[0]);
          R(18, 1, 6, wa - 1, '#2e2018');
          R(18, 1, 2, wa - 1, '#4a3424');
        }
        if (edgeB) {
          R(0, wb, TS, 3, water[0]);
          R(26, wb + 1, 6, TS - wb - 1, '#2e2018');
          R(26, wb + 1, 2, TS - wb - 1, '#4a3424');
        }
        // Tablier : quatre planches en travers, joints sombres, reflet du côté de la lumière, clous aux bouts.
        R(0, wa, TS, wb - wa, '#3a2618');
        for (let k = 0; k < 4; k++) {
          const u = k * 12,
            tone = h(x, y, k),
            base = tone < 0.33 ? '#9a6c40' : tone < 0.66 ? '#a87a4c' : '#b98a58',
            short = h(x, y, k + 9) < 0.15 ? 2 : 0;
          R(u + 1, wa + short, 10, wb - wa - short * 2, base);
          R(u + 1, wa + short, 2, wb - wa - short * 2, '#d1a66c');
          R(u + 9, wa + short, 2, wb - wa - short * 2, '#6e4a2c');
          if (h(x, y, k + 20) < 0.2) R(u + 4, wa + 10 + h(x, y, k + 30) * 20, 3, 2, '#6e4a2c');
          if (edgeA) R(u + 5, wa + 2, 2, 2, '#3a3036');
          if (edgeB) R(u + 5, wb - 4, 2, 2, '#3a3036');
        }
        // Seuil aux deux bouts du pont, là où il pose sur la terre ferme.
        if (!end(-1)) {
          R(0, wa, 5, wb - wa, '#5e4030');
          R(0, wa, 5, 2, '#8a6440');
        }
        if (!end(1)) {
          R(TS - 5, wa, 5, wb - wa, '#4e3424');
          R(TS - 5, wb - 2, 5, 2, '#3a2618');
        }
        // Garde-corps : longue main courante et poteaux, en trois tons avec contour.
        for (const [on, w0] of [[edgeA, 0], [edgeB, TS - 8]]) {
          if (!on) continue;
          R(0, w0, TS, 8, '#22160e');
          R(0, w0 + 1, TS, 6, '#7a5236');
          R(0, w0 + 1, TS, 2, '#a07048');
          R(0, w0 + 5, TS, 2, '#4e3422');
          for (const u of end(-1) ? [TS - 10] : [2, TS - 10]) {
            R(u - 1, w0 - 2, 10, 12, '#22160e');
            R(u, w0 - 1, 8, 10, '#6e4a30');
            R(u, w0 - 1, 8, 3, '#b08050');
            R(u + 6, w0 + 1, 2, 8, '#3e2a1c');
          }
        }
      }
  }
  // Lieux d'exploration (PIXEL_PLACES) : ruines et tours placées par la génération de l'île (les refuges : house.js).
  function drawPixelLandmarks(c) {
    if (game.world.instance) return;
    const R = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), w, h);
    };
    for (let p of PIXEL_PLACES) {
      let x = p.x * TS,
        y = p.y * TS;
      if (Math.abs(x - camX - W / 2) > W / 2 + 180 || Math.abs(y - camY - H / 2) > H / 2 + 180) continue;
      // Les refuges sont des bâtiments où l'on entre, dessinés par house.js.
      if (p.type === 'camp') continue;
      c.save();
      c.translate(x, y);
      c.fillStyle = 'rgba(10,14,18,.35)';
      c.beginPath();
      c.ellipse(0, 40, 66, 14, 0, 0, Math.PI * 2);
      c.fill();
      if (p.type === 'ruins') {
        // Arche effondrée : pierres taillées, mousse, lierre et blocs tombés.
        for (const dx of [-48, 26]) {
          R(dx, -48, 24, 88, '#6b7178');
          R(dx, -48, 6, 88, '#8c9399');
          R(dx + 18, -48, 6, 88, '#4e545a');
          for (let k = 0; k < 6; k++) R(dx, -40 + k * 14, 24, 2, '#4a4f55');
          R(dx - 3, -56, 30, 10, '#9aa1a6');
          R(dx + 2, -30, 6, 22, '#4f7a42');
          R(dx + 4, -10, 4, 14, '#6a9a52');
        }
        R(-24, -58, 26, 10, '#9aa1a6');
        R(-24, -48, 26, 3, '#5e646a');
        R(-58, 26, 22, 14, '#7a8086');
        R(36, 30, 18, 10, '#6b7178');
        R(-12, 30, 30, 10, '#8c9399');
        R(-60, 22, 8, 4, '#5a8a4a');
      } else {
        // Tour de guet : assises de pierre, créneaux, fenêtres éclairées et bannière.
        R(-30, -96, 60, 136, '#5e666e');
        R(-30, -96, 10, 136, '#7a838a');
        R(20, -96, 10, 136, '#454c52');
        for (let k = 0; k < 9; k++) {
          R(-30, -86 + k * 14, 60, 2, '#3e444a');
          R(-20 + (k % 2) * 16, -84 + k * 14, 2, 12, '#3e444a');
        }
        R(-36, -108, 72, 14, '#7a838a');
        for (let k = 0; k < 4; k++) R(-36 + k * 20, -120, 12, 12, '#7a838a');
        R(-7, -70, 14, 20, '#ffd36b');
        R(-7, -30, 14, 20, '#ffd36b');
        R(-1, -70, 2, 20, '#3e444a');
        R(-12, 14, 24, 26, '#2a2420');
        R(-2, -150, 3, 32, '#4a3324');
        R(1, -150, 22, 14, '#a83a3a');
        R(1, -146, 22, 3, '#e0c060');
        canaanLight(x, y - 60, 130, '#ffd36b');
      }
      c.font = 'bold 12px system-ui';
      c.textAlign = 'center';
      c.strokeStyle = '#101b20';
      c.lineWidth = 3;
      c.strokeText(p.name, 0, p.type === 'tower' ? -158 : -90);
      c.fillStyle = '#f6e2b1';
      c.fillText(p.name, 0, p.type === 'tower' ? -158 : -90);
      c.restore();
    }
  }
  // Monstres, élites et boss : sprites détaillés du kit graphique commun.
  function drawPixelMob(m) {
    drawCanaanActor(ctx, m);
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    PIXEL_TERRAIN,
    PIXEL_DECOR,
    CANAAN_HERO_SPRITES,
    drawHeroArt,
    drawFeralArt,
    canaanHeroSprite,
    drawPixelHero,
    drawPixelRoads,
    drawPixelLandmarks,
    drawPixelMob
  });
})();
