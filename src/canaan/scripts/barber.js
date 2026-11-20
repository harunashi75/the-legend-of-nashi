// Salon de coiffure du Camp de l'Aurore : Sélène, la coiffeuse, change l'apparence du héros (sexe, race, peau,
// coiffure, couleurs des cheveux et des yeux), comme à la création. Le nom, la classe, la tenue de création et
// l'apparence portée (garde-robe, V) ne changent pas. Purement visuel, pour 100 or (rien
// n'est payé si rien ne change).
// Le salon est posé par camp-life.js (CANAAN_CAMP_LIFE.barber() : où se tient la coiffeuse). La fenêtre montre un
// aperçu animé ; rien ne change avant « Valider ».
// L'hôte décide : coiffeuse à portée, apparence vérifiée (action barber-look d'un invité). Un invité garde aussi la
// nouvelle apparence dans ses réglages, qu'il envoie à chaque fois qu'il rejoint une partie.
(() => {
  'use strict';
  const esc = text => safeGearText(text);
  const NAME = 'Sélène, la coiffeuse';
  const REACH = 120;
  const PRICE = 100;
  // Apparence de Sélène (dessinée avec le sprite des héros).
  const LOOK = sanitizeLook({
    sex: 'f',
    race: 'elfe',
    skin: '#f6dcc8',
    hairStyle: 'tresses',
    hair: '#a8442a',
    eyes: '#3a9a4a',
    outfit: 'rose'
  });
  // Ce que le salon change : [clé, titre, liste des valeurs, pastilles de couleur].
  const FIELDS = [
    ['sex', 'Sexe', () => LOOK_SEXES, false],
    ['race', 'Race', () => LOOK_RACES, false],
    ['skin', 'Peau', look => raceOf(look).skins, true],
    ['hairStyle', 'Coiffure', () => LOOK_HAIR_STYLES, false],
    ['hair', 'Cheveux', () => LOOK_HAIR_COLORS, true],
    ['eyes', 'Yeux', () => LOOK_EYE_COLORS, true]
  ];
  const raceOf = look => LOOK_RACES.find(r => r.id === look.race) || LOOK_RACES[0];
  const valueOf = item => (typeof item === 'string' ? item : item.id);

  // ---------------------------------------------------------------- Règles
  // Où se tient Sélène (pixels), ou null : salon absent, ou ailleurs que sur l'île.
  function spot() {
    if (game.world.instance || canaanUnder()) return null;
    return CANAAN_CAMP_LIFE.barber();
  }
  function near(p) {
    const s = spot();
    return !!s && !canaanInHouse(p.x / TS, p.y / TS) && Math.hypot(p.x - s.x, p.y - s.y) < REACH;
  }
  // Nouvelle apparence d'un héros : seulement ce que le salon change ; la tenue de création et l'apparence portée
  // restent les siennes.
  function restyle(hero, look) {
    const clean = sanitizeLook(look),
      next = { ...hero.look };
    for (const [key] of FIELDS) next[key] = clean[key];
    hero.look = sanitizeLook(next);
    hero.netBag = null;
    return true;
  }
  // L'apparence proposée est-elle celle que le héros a déjà (pour ce que le salon change) ?
  function same(hero, look) {
    const a = sanitizeLook(hero.look),
      b = sanitizeLook(look);
    return FIELDS.every(([key]) => a[key] === b[key]);
  }
  // Chez l'hôte (pour lui ou un invité) : coiffeuse à portée, un changement, l'or payé ; puis la nouvelle apparence.
  function restyleFor(hero, look) {
    if (!near(hero.player)) return false;
    if (same(hero, look)) return (canaanLootNotice(hero, '✂️ Rien n’a changé : rien à payer.'), false);
    if (hero.player.gold < PRICE) return (canaanLootNotice(hero, '💰 Il faut ' + PRICE + ' or.'), false);
    hero.player.gold -= PRICE;
    restyle(hero, look);
    canaanLootNotice(hero, '✂️ Nouvelle apparence ! (−' + PRICE + ' or)');
    return true;
  }
  // Action d'un invité, chez l'hôte.
  function handle(hero, action) {
    if (action.op !== 'barber-look') return false;
    return restyleFor(hero, decodeLook(action.look));
  }

  // ---------------------------------------------------------------- Fenêtre
  const ui = { draft: null, face: 0, frame: 0 };
  const isOpen = () => !!document.getElementById('barberPreview');
  function row(look, [key, title, list, swatch]) {
    const items = list(look),
      current = look[key];
    return (
      '<div class="barber-row"><span class="barber-title">' +
      (key === 'skin' && look.race === 'minotaure' ? 'Pelage' : title) +
      '</span><div class="barber-options">' +
      items
        .map((item, i) => {
          const value = valueOf(item),
            on = value === current ? ' on' : '',
            attrs = ' data-action="barberSet" data-key="' + key + '" data-index="' + i + '"';
          if (!swatch)
            return (
              '<button type="button" class="barber-choice' +
              on +
              '"' +
              attrs +
              '>' +
              esc(item.name) +
              '</button>'
            );
          return (
            '<button type="button" class="barber-swatch' +
            on +
            '"' +
            attrs +
            ' title="' +
            esc(value) +
            '" aria-label="' +
            esc(title + ' ' + (i + 1)) +
            '" style="background:' +
            value +
            '"></button>'
          );
        })
        .join('') +
      '</div></div>'
    );
  }
  function render() {
    const look = ui.draft;
    modernPanel(
      rpgHeader('✂️ Salon de coiffure · ' + esc(NAME)) +
        '<div class="modern-body barber-panel panel-scroll" data-panel-size="char"><p class="muted">« Assieds-toi, je m’occupe de tout. Une nouvelle tête, un nouveau départ ! » Rien ne change avant de valider. Ta tenue et ta garde-robe restent les mêmes. · Ton or : <b>' +
        Math.floor(P.gold) +
        '</b></p>' +
        '<div class="barber-body"><div class="barber-stage"><canvas id="barberPreview" width="160" height="200" aria-label="Aperçu du héros"></canvas>' +
        '<div class="barber-turn"><button type="button" data-action="barberTurn" data-dir="-1" aria-label="Tourner à gauche">⟲</button>' +
        '<button type="button" data-action="barberRandom">🎲 Au hasard</button>' +
        '<button type="button" data-action="barberTurn" data-dir="1" aria-label="Tourner à droite">⟳</button></div></div>' +
        '<div class="barber-fields">' +
        FIELDS.map(f => row(look, f)).join('') +
        '</div></div><div class="modern-foot"><button type="button" class="epic" data-action="barberApply">✂️ Valider (' +
        PRICE +
        ' or)</button>' +
        '<button type="button" data-action="barberReset">↺ Comme avant</button></div></div>'
    );
    drawPreview();
  }
  // Aperçu : le héros marche sur place, sans son apparence portée (pour bien voir sa coiffure).
  function drawPreview() {
    const canvas = document.getElementById('barberPreview');
    if (!canvas || !ui.draft || typeof canvas.getContext !== 'function') return;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = false;
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath();
    c.ellipse(canvas.width / 2, canvas.height - 22, 46, 10, 0, 0, Math.PI * 2);
    c.fill();
    const sprite = canaanHeroSprite({ ...ui.draft, wear: '' }, ui.face, ui.frame % 4, { tool: 'none' }),
      scale = ui.draft.race === 'minotaure' ? 3.2 : 2.9,
      w = 52 * scale,
      h = 64 * scale;
    c.drawImage(
      sprite,
      Math.round(canvas.width / 2 - w / 2),
      Math.round(canvas.height - 14 - h),
      Math.round(w),
      Math.round(h)
    );
  }
  setInterval(() => {
    if (!started || !ui.draft || !isOpen()) return;
    ui.frame++;
    drawPreview();
  }, 220);
  function open() {
    ui.draft = { ...sanitizeLook(game.hero.look), wear: '' };
    ui.face = 0;
    CANAAN_SOUND.voice(NAME, 'Bienvenue, voyageur !', spot()?.x, spot()?.y);
    render();
  }
  function set(key, index) {
    const field = FIELDS.find(f => f[0] === key);
    if (!ui.draft || !field) return false;
    const list = field[2](ui.draft);
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return false;
    const next = { ...ui.draft, [key]: valueOf(list[index]) };
    // Changer de race garde la même position de teinte dans la nouvelle palette.
    if (key === 'race')
      next.skin = list[index].skins[Math.max(0, raceOf(ui.draft).skins.indexOf(ui.draft.skin))];
    ui.draft = sanitizeLook(next);
    render();
    return true;
  }
  function apply() {
    if (!ui.draft) return false;
    if (!near(P)) {
      toast('✂️ Approche-toi de Sélène pour changer d’apparence.');
      return false;
    }
    const look = ui.draft;
    if (same(game.hero, look)) {
      toast('✂️ Rien n’a changé : rien à payer.');
      return false;
    }
    if (P.gold < PRICE) {
      toast('💰 Il faut ' + PRICE + ' or.');
      return false;
    }
    if (game.mode === 'guest') {
      // Chez l'invité : tout de suite à l'écran, gardé dans ses réglages, et demandé à l'hôte (qui encaisse).
      restyle(game.hero, look);
      CANAAN_NET.setLook({ ...look, outfit: game.hero.look.outfit, wear: '' });
      CANAAN_NET.requestAction({ op: 'barber-look', look: encodeLook({ ...look, wear: '' }) });
      toast('✂️ Nouvelle apparence ! (−' + PRICE + ' or)');
    } else {
      if (!restyleFor(game.hero, look)) return false;
      saveGame();
    }
    ui.draft = null;
    closePanels();
    return true;
  }

  // ---------------------------------------------------------------- Dans le monde
  // E chez l'hôte (pour lui ou pour un invité) : true si le salon a répondu.
  function interact(hero = game.hero) {
    if (!near(hero.player)) return false;
    if (hero === game.hero) open();
    return true;
  }
  // Invité : la fenêtre s'ouvre chez lui ; « Valider » passe par l'hôte.
  function guestUse() {
    if (!near(P)) return false;
    open();
    return true;
  }
  // Sélène, sur le tapis du salon (sprite de héros, nom de près).
  function draw(c) {
    const s = spot();
    if (!s || canaanInHouse(P.x / TS, P.y / TS)) return;
    if (Math.abs(s.x - P.x) > W || Math.abs(s.y - P.y) > H) return;
    const spr = canaanHeroSprite(LOOK, 0, 0, { tool: 'none' });
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(
      spr,
      Math.round(s.x - 26 - (spr.padX || 0)),
      Math.round(s.y + 18 - 60 - (spr.padY || 0)),
      spr.width,
      spr.height
    );
    c.restore();
    if (Math.hypot(P.x - s.x, P.y - s.y) < 200) drawCanaanName(c, NAME, s.x, s.y - 62);
  }
  // Invitation [E] au-dessus de Sélène, dessinée après l'occlusion.
  function drawPrompts(c) {
    const s = spot();
    if (s && near(P)) drawCanaanPrompt(c, '[E] Changer d’apparence', s.x, s.y - 80);
  }

  window.CANAAN_BARBER = Object.freeze({
    PRICE,
    near,
    restyle,
    handle,
    interact,
    guestUse,
    draw,
    drawPrompts,
    actions: Object.freeze({
      set,
      turn(dir) {
        if (!ui.draft) return false;
        ui.face = (((ui.face + (dir < 0 ? 3 : 1)) % 4) + 4) % 4;
        drawPreview();
        return true;
      },
      random() {
        if (!ui.draft) return false;
        ui.draft = { ...randomLook(Math.random), outfit: ui.draft.outfit, wear: '' };
        render();
        return true;
      },
      reset() {
        if (!ui.draft) return false;
        ui.draft = { ...sanitizeLook(game.hero.look), wear: '' };
        render();
        return true;
      },
      apply
    }),
    state: () => (ui.draft ? { ...ui.draft, face: ui.face } : null)
  });
})();
