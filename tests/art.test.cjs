// Pixel art : kit commun (client/art/pixel-kit.js) et plume SVG des icônes (client/icons/svg-pen.js).
const { test } = require('node:test');
const { fs, assert, path } = require('./helpers/context.cjs');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..', 'src', 'canaan');
const load = f => import(pathToFileURL(path.join(ROOT, f)).href);

// Toile en mémoire : rectangles pleins en #rrggbb, lecture et écriture des pixels. Assez pour vérifier pixel par
// pixel le contour et le modelé du kit sans navigateur.
function memoryCanvas() {
  const cv = { width: 0, height: 0 };
  let data = null;
  const pixels = () => (data && data.length === cv.width * cv.height * 4 ? data : (data = new Uint8ClampedArray(cv.width * cv.height * 4)));
  const g = {
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      const d = pixels(),
        c = [1, 3, 5].map(i => parseInt(this.fillStyle.slice(i, i + 2), 16));
      for (let yy = Math.max(0, y); yy < Math.min(cv.height, y + h); yy++)
        for (let xx = Math.max(0, x); xx < Math.min(cv.width, x + w); xx++) d.set([...c, 255], (yy * cv.width + xx) * 4);
    },
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(pixels()), width: w, height: h }),
    putImageData: img => pixels().set(img.data)
  };
  cv.getContext = () => g;
  cv.pixel = (x, y) => [...pixels().slice((y * cv.width + x) * 4, (y * cv.width + x) * 4 + 4)];
  return cv;
}
const withDocument = async fn => {
  const before = globalThis.document;
  globalThis.document = { createElement: () => memoryCanvas() };
  try {
    return await fn();
  } finally {
    if (before === undefined) delete globalThis.document;
    else globalThis.document = before;
  }
};

test('Kit de pixel art : couleurs, bruits à graine, trame, polygones et courbes', async () => {
  const K = await load('client/art/pixel-kit.js');
  assert.ok(Object.isFrozen(K.CANAAN_PIXEL_KIT));
  for (const [name, fn] of Object.entries(K)) if (name !== 'CANAAN_PIXEL_KIT') assert.equal(K.CANAAN_PIXEL_KIT[name], fn, name);
  // Couleurs.
  assert.deepEqual(K.rgb('#ff8010'), [255, 128, 16]);
  assert.equal(K.hex([300, -5, 16.4]), '#ff0010');
  assert.equal(K.mix('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(K.tint('#808080', 0.5), '#404040');
  assert.equal(K.tint('#000000', 2), '#ffffff', 'tint vers le blanc au-dessus de 1');
  assert.equal(K.shade('#808080', 0.5), '#404040');
  assert.equal(K.shade('#102030', 2), '#204060', 'shade multiplie au-dessus de 1');
  assert.equal(K.shade('illisible', 1), '#888888');
  assert.equal(K.rgba('#ff8000', 0.5), 'rgba(255,128,0,0.5)');
  // Bruits : même valeur pour les mêmes coordonnées, dans [0, 1[, familles distinctes.
  for (const f of [K.noise, K.sinNoise(73.3), K.hashGrid]) {
    const v = f(12, 34);
    assert.equal(f(12, 34), v);
    assert.ok(v >= 0 && v < 1, String(v));
  }
  assert.equal(K.noise(5, 6, 2), K.sinNoise(71.3)(5, 6, 2));
  assert.notEqual(K.sinNoise(73.3)(5, 6, 2), K.noise(5, 6, 2));
  const seuils = new Set();
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seuils.add(K.bayer(x, y));
  assert.equal(seuils.size, 16);
  assert.equal(K.bayer(5, 6), K.bayer(1, 2), 'trame répétée tous les 4 pixels');
  // Formes : rangées d'un carré, extrémités d'une courbe.
  assert.deepEqual(K.spans([[0, 0], [3, 0], [3, 2], [0, 2]]), [[0, 0, 3], [1, 0, 3]]);
  const courbe = K.bez([0, 0], [5, 10], [10, 0], 4);
  assert.deepEqual([courbe[0], courbe.at(-1), courbe.length], [[0, 0], [10, 0], 5]);
});

test('Kit de pixel art : contour sombre, modelé (reflet en haut, ombre en bas) et peintre avec cache', async () => {
  const K = await load('client/art/pixel-kit.js');
  await withDocument(async () => {
    // Contour : les pixels vides qui touchent une forme par un côté deviennent l'encre ; les coins restent vides.
    const k = K.brush(7, 7);
    k.rect(2, 2, 3, 3, '#40a060');
    K.outline(k);
    assert.deepEqual(k.cv.pixel(1, 3), [...K.rgb(K.PIXEL_INK), 255], 'à gauche');
    assert.deepEqual(k.cv.pixel(3, 5), [...K.rgb(K.PIXEL_INK), 255], 'en dessous');
    assert.deepEqual(k.cv.pixel(1, 1), [0, 0, 0, 0], 'coin');
    assert.deepEqual(k.cv.pixel(0, 3), [0, 0, 0, 0], 'un seul pixel d’épaisseur');
    assert.deepEqual(k.cv.pixel(3, 3), [0x40, 0xa0, 0x60, 255], 'forme intacte');
    // Modelé : sur un carré gris uni, le haut s'éclaircit et le bas s'assombrit.
    const sq = K.brush(8, 8);
    sq.rect(0, 0, 8, 8, '#808080');
    K.polish(sq.cv, 8);
    const [haut, milieu, bas] = [0, 4, 7].map(y => sq.cv.pixel(4, y)[0]);
    assert.ok(haut > milieu && milieu > bas, [haut, milieu, bas].join());
    // Peintre : un seul dessin par clé, toile contourée gardée.
    const paint = K.painter();
    let n = 0;
    const a = paint('x', 5, 5, (b, kit) => {
      n++;
      assert.equal(kit, K.CANAAN_PIXEL_KIT);
      b.px(2, 2, '#ffffff');
    });
    assert.equal(paint('x', 5, 5, () => n++), a);
    assert.equal(n, 1);
    assert.deepEqual(a.pixel(2, 1), [...K.rgb(K.PIXEL_INK), 255]);
  });
  // Sans document (tests sans rendu), le peintre ne dessine rien.
  assert.equal(K.painter()('y', 4, 4, () => assert.fail('pas de dessin')), null);
});

test('Plume SVG des icônes : contour d’encre, reflets et étoiles réglés par jeu d’icônes', async () => {
  const { svgPen } = await load('client/icons/svg-pen.js');
  const pen = svgPen({ ink: '#123456', width: 1.8, radius: 1.5, lightOpacity: '.7', center: 16 });
  assert.ok(Object.isFrozen(pen));
  assert.equal(pen.O, 'stroke="#123456" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"');
  assert.equal(pen.p('M0 0', '#fff'), '<path d="M0 0" fill="#fff" ' + pen.O + '/>');
  assert.equal(pen.s('M0 0', '#000'), '<path d="M0 0" fill="#000"/>', 'aplat sans contour');
  assert.match(pen.r(1, 2, 3, 4, '#f00'), /rx="1.5"/);
  assert.match(pen.hi('M0 0'), /stroke="#ffffff".*opacity=".7"\/>$/);
  assert.equal(pen.L('M0 0', '#f00'), pen.l('M0 0', '#123456', 4.4) + pen.l('M0 0', '#f00', 2.4), 'trait cerné');
  assert.match(pen.star(5, 10, 4), /^M16\.0 6\.0 L/, 'étoile centrée sur la grille');
});

test('Pixel art : un seul kit, aucun art ne redéfinit ses outils', () => {
  // Les arts (bâtiments, nains, elfes, portails, héros, créatures, icônes) prennent toile, bruit, contour et plume au
  // kit commun ; une copie locale divergerait sans bruit (autre contour, autre grain).
  const arts = [
    ...fs.readdirSync(path.join(ROOT, 'client', 'art')).map(f => 'client/art/' + f),
    ...fs.readdirSync(path.join(ROOT, 'client', 'icons')).map(f => 'client/icons/' + f),
    'scripts/pixel-art.js',
    'scripts/elven-art.js',
    'scripts/portal-art.js',
    'scripts/sprite-kit.js'
  ];
  const signs = {
    'client/art/pixel-kit.js': [/43758\.5453/, /createElement\('canvas'\)/],
    'client/icons/svg-pen.js': [/stroke-linejoin="round" stroke-linecap="round"/]
  };
  for (const file of arts) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const [owner, patterns] of Object.entries(signs))
      if (file !== owner) for (const re of patterns) assert.doesNotMatch(src, re, file + ' : outil du kit (' + owner + ') recopié');
    assert.doesNotMatch(src, /CANAAN_BUILDING_ART\.kit/, file);
  }
});
