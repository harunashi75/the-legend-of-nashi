// Écran titre : sélection des aventures (trois slots, héros affiché au centre, liste à droite) et création du héros
// (races à gauche, aperçu au centre, classe et apparence à droite).
// Choisir un slot recharge la page : chaque aventure démarre dans un état neuf, sans reste d'une autre.
(() => {
  'use strict';
  // Interface du menu : un seul slot à la fois en création ou en confirmation de suppression.
  // selected : slot affiché sur la scène ; look : apparence en cours de création ;
  // lookFor : 'slot' (nouvelle aventure) ou 'join' (héros d'invité).
  const ui = {
    selected: null,
    creating: null,
    confirming: null,
    message: '',
    joining: false,
    look: null,
    lookFor: null,
    face: 0,
    name: '',
    heroName: '',
    draft: null,
    focusName: false,
    classe: 'druide'
  };
  const esc = text => safeGearText(text);
  function when(time) {
    if (!time) return '';
    try {
      return new Date(time).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '';
    }
  }
  const classLabel = id => {
    const c = classById(id);
    return c
      ? '<span class="slot-class" style="--cls:' + c.color + '">' + c.icon + ' ' + esc(c.name) + '</span>'
      : '';
  };
  const occupied = info => info.state === 'aventure' || info.state === 'illisible';
  // ---------------------------------------------------------------- Sélection : liste des aventures
  function card(info) {
    const n = info.slot;
    if (info.state === 'aventure')
      return (
        '<button type="button" class="slot-card' +
        (ui.selected === n ? ' selected' : '') +
        '" data-action="selectSlot" data-slot="' +
        n +
        '" aria-pressed="' +
        (ui.selected === n) +
        '"><canvas class="slot-face" data-face-slot="' +
        n +
        '" width="44" height="30" aria-hidden="true"></canvas><span class="slot-text"><span class="slot-hero">' +
        esc(info.heros || 'Héros') +
        '</span><span class="slot-meta"><span>Niveau ' +
        info.level +
        '</span> ' +
        classLabel(info.classe) +
        '</span><span class="slot-world">' +
        esc(info.nom) +
        '</span></span></button>'
      );
    if (info.state === 'illisible')
      return (
        '<button type="button" class="slot-card broken' +
        (ui.selected === n ? ' selected' : '') +
        '" data-action="selectSlot" data-slot="' +
        n +
        '"><span class="slot-plus" aria-hidden="true">!</span><span class="slot-text"><span class="slot-hero">Sauvegarde illisible</span><span class="slot-world">Slot ' +
        n +
        '</span></span></button>'
      );
    return (
      '<button type="button" class="slot-card empty" data-action="newSlot" data-slot="' +
      n +
      '"><span class="slot-plus" aria-hidden="true">+</span><span class="slot-text"><span class="slot-hero">Créer un héros</span><span class="slot-world"><span>Emplacement libre</span> · <span>Slot ' +
      n +
      '</span></span></span></button>'
    );
  }
  // Confirmation de suppression : les héros des invités sont perdus avec le monde.
  function confirmBox(info) {
    return (
      '<div class="slot-confirm" role="alertdialog"><h3>' +
      esc(info.nom) +
      '</h3><p class="slot-warning">Supprimer cette aventure ? Le monde' +
      (info.invites?.length
        ? ' et les héros de tes invités (' + esc(info.invites.join(', ')) + ') seront perdus.'
        : ' et ton héros seront perdus.') +
      ' Une copie de secours est gardée dans le dossier des sauvegardes.</p>' +
      '<div class="slot-actions"><button type="button" class="slot-danger" data-action="confirmDeleteSlot" data-slot="' +
      info.slot +
      '">Supprimer définitivement</button><button type="button" class="slot-secondary" data-action="cancelSlotMenu">Annuler</button></div></div>'
    );
  }
  // Scène : le héros du slot choisi, son nom et son niveau, la rotation.
  function stage(info) {
    if (!info)
      return '<div class="cs-stage empty"><p class="cs-empty">Aucun héros pour l’instant.</p><p class="cs-empty-sub">Choisis un emplacement libre pour créer ton premier personnage.</p></div>';
    if (info.state === 'illisible')
      return '<div class="cs-stage empty"><p class="cs-empty">Sauvegarde illisible</p><p class="cs-empty-sub">Ouvre-la pour proposer « Repartir à neuf » (une copie est gardée), ou supprime-la.</p></div>';
    return (
      '<div class="cs-stage"><div class="cs-nameplate"><h2>' +
      esc(info.heros || 'Héros') +
      '</h2><p class="cs-sub"><span>Niveau ' +
      info.level +
      '</span> ' +
      classLabel(info.classe) +
      '</p><p class="cs-world">' +
      esc(info.nom) +
      '</p></div><canvas id="selectPreview" width="240" height="300" aria-label="Aperçu du héros"></canvas>' +
      '<div class="look-turn"><button type="button" class="slot-secondary cs-turn" data-action="lookTurn" data-dir="-1" aria-label="Tourner à gauche">⟲</button>' +
      '<button type="button" class="slot-secondary cs-turn" data-action="lookTurn" data-dir="1" aria-label="Tourner à droite">⟳</button></div>' +
      '<p class="cs-meta"><span>' +
      info.gold.toLocaleString('fr-FR') +
      ' or</span>' +
      (info.invites.length ? ' · <span>Invités : ' + esc(info.invites.join(', ')) + '</span>' : '') +
      (info.updated ? ' · <span>Dernière partie : ' + esc(when(info.updated)) + '</span>' : '') +
      '</p></div>'
    );
  }
  // Boutons sous la scène : entrer dans le monde (ou ouvrir une sauvegarde illisible), supprimer.
  function enterBar(info) {
    if (!info) return '<div class="cs-enter"></div>';
    const n = info.slot;
    return (
      '<div class="cs-enter"><button type="button" class="slot-primary cs-enter-button" data-action="playSlot" data-slot="' +
      n +
      '">' +
      (info.state === 'illisible' ? 'Ouvrir' : 'Entrer dans le monde') +
      '</button><button type="button" class="slot-secondary cs-delete" data-action="askDeleteSlot" data-slot="' +
      n +
      '">Supprimer</button></div>'
    );
  }
  // ---------------------------------------------------------------- Création du héros (apparence)
  const lookRow = (title, key, items, current, swatch) =>
    '<div class="look-row"><span class="look-title">' +
    title +
    '</span><div class="look-options' +
    (swatch ? ' swatches' : '') +
    '">' +
    items
      .map((item, i) => {
        const value = typeof item === 'string' ? item : item.id,
          on = value === current ? ' on' : '',
          label = typeof item === 'string' ? '' : item.name;
        if (!swatch)
          return (
            '<button type="button" class="look-choice' +
            on +
            '" data-action="lookSet" data-key="' +
            key +
            '" data-index="' +
            i +
            '">' +
            esc(label) +
            '</button>'
          );
        // Pastille de couleur (valeurs fixes de shared/data/looks.js) ; une tenue montre armure et cape.
        const colors = typeof item === 'string' ? [item, item] : [item.armor[2], item.cape[1]];
        return (
          '<button type="button" class="look-swatch' +
          on +
          '" data-action="lookSet" data-key="' +
          key +
          '" data-index="' +
          i +
          '" title="' +
          esc(label || value) +
          '" aria-label="' +
          esc(label || value) +
          '"' +
          ' style="background:linear-gradient(135deg,' +
          colors[0] +
          ' 50%,' +
          colors[1] +
          ' 50%)"></button>'
        );
      })
      .join('') +
    '</div></div>';
  // Races : un portrait par race (dessiné après l'affichage), le nom, puis la présentation de la race choisie.
  function raceList(look) {
    return (
      '<div class="race-list">' +
      LOOK_RACES.map(
        (r, i) =>
          '<button type="button" class="race-choice look-choice' +
          (r.id === look.race ? ' on' : '') +
          '" data-action="lookSet" data-key="race" data-index="' +
          i +
          '"><canvas class="race-portrait" data-portrait="' +
          i +
          '" width="44" height="30" aria-hidden="true"></canvas><span>' +
          esc(r.name) +
          '</span></button>'
      ).join('') +
      '</div>'
    );
  }
  function creator() {
    const look = ui.look,
      race = lookRace(look.race),
      forSlot = ui.lookFor === 'slot',
      outfit = lookOutfit(look.outfit);
    return (
      '<section class="look-creator" aria-label="Création du héros"><header class="cc-head"><h3>' +
      (forSlot ? 'Nouvelle aventure · Slot ' + ui.creating : 'Mon héros d’invité') +
      '</h3></header><div class="look-body">' +
      // Colonne gauche : sexe et race.
      '<aside class="cc-col cc-left">' +
      lookRow('Sexe', 'sex', LOOK_SEXES, look.sex) +
      '<h4 class="cc-title">Race</h4>' +
      raceList(look) +
      '<div class="cc-lore"><b>' +
      esc(race.name) +
      '</b><p>' +
      esc(race.lore) +
      '</p></div></aside>' +
      // Centre : aperçu animé.
      '<div class="look-stage"><canvas id="lookPreview" width="240" height="300" aria-label="Aperçu du héros"></canvas>' +
      '<div class="look-turn"><button type="button" class="slot-secondary" data-action="lookTurn" data-dir="-1" aria-label="Tourner à gauche">⟲</button>' +
      '<button type="button" class="slot-secondary" data-action="lookRandom">🎲 Au hasard</button>' +
      '<button type="button" class="slot-secondary" data-action="lookTurn" data-dir="1" aria-label="Tourner à droite">⟳</button></div>' +
      '<p class="look-summary">' +
      esc(LOOK_SEXES.find(x => x.id === look.sex).name + ' · ' + race.name + ' · ' + outfit.name) +
      '</p></div>' +
      // Colonne droite : classe et apparence.
      '<aside class="cc-col cc-right look-fields">' +
      (forSlot ? '<h4 class="cc-title">Classe</h4>' + classRow() : '') +
      '<h4 class="cc-title">Apparence</h4>' +
      lookRow(race.fur ? 'Pelage' : 'Peau', 'skin', race.skins, look.skin, true) +
      lookRow('Coiffure', 'hairStyle', LOOK_HAIR_STYLES, look.hairStyle) +
      lookRow('Cheveux', 'hair', LOOK_HAIR_COLORS, look.hair, true) +
      lookRow('Yeux', 'eyes', LOOK_EYE_COLORS, look.eyes, true) +
      lookRow('Tenue', 'outfit', LOOK_OUTFITS, look.outfit, true) +
      '<p class="look-note">L’apparence est purement visuelle : aucune race n’est plus forte qu’une autre.</p>' +
      '</aside></div>' +
      // Pied : retour, noms, validation.
      '<footer class="cc-foot"><button type="button" class="slot-secondary cc-back" data-action="' +
      (forSlot ? 'cancelSlotMenu' : 'lookBack') +
      '">' +
      (forSlot ? 'Annuler' : 'Retour') +
      '</button>' +
      (forSlot
        ? '<div class="cc-names"><label class="slot-label" for="heroName">Nom du héros</label><input id="heroName" class="slot-input" type="text" maxlength="24" autocomplete="off" placeholder="Héros" value="' +
          esc(ui.heroName) +
          '"><label class="slot-label" for="slotName">Nom de l’aventure</label><input id="slotName" class="slot-input" type="text" maxlength="32" autocomplete="off" value="' +
          esc(ui.name) +
          '"></div><button type="button" class="slot-primary cc-create" data-action="createSlot" data-slot="' +
          ui.creating +
          '">Créer l’aventure</button>'
        : '<button type="button" class="slot-primary cc-create" data-action="lookSaveJoin">Enregistrer mon héros</button>') +
      '</footer></section>'
    );
  }
  // Classe du héros (changeable ensuite gratuitement au Camp de l'Aurore).
  function classRow() {
    const chosen = classById(ui.classe) || CLASSES[0];
    return (
      '<div class="class-list">' +
      CLASSES.map(
        c =>
          '<button type="button" class="class-choice look-choice' +
          (c.id === chosen.id ? ' on' : '') +
          '" style="--cls:' +
          c.color +
          '" data-action="classSet" data-class="' +
          c.id +
          '" title="' +
          esc(c.name) +
          '">' +
          c.icon +
          '<span>' +
          esc(c.name) +
          '</span></button>'
      ).join('') +
      '</div><p class="look-note class-pick"><b>' +
      esc(chosen.name) +
      '</b> · ' +
      esc(chosen.style) +
      '. Sort spécial (F) : ' +
      chosen.special.icon +
      ' ' +
      esc(chosen.special.name) +
      '. Tu pourras changer de classe au Camp de l’Aurore.</p>'
    );
  }
  // ---------------------------------------------------------------- Dessins : aperçus et portraits
  // Héros sur un socle lumineux, au centre d'un canevas ; bob : léger rebond de respiration.
  function drawHero(canvas, look, frame, bob = 0) {
    if (!canvas || !look || typeof canvas.getContext !== 'function' || typeof canaanHeroSprite !== 'function')
      return;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = false;
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath();
    c.ellipse(canvas.width / 2, canvas.height - 26, 62, 13, 0, 0, Math.PI * 2);
    c.fill();
    const sprite = canaanHeroSprite(look, ui.face, frame, { tool: 'none' }),
      scale = 4 * lookRace(look.race).scale,
      w = sprite.width * scale,
      h = sprite.height * scale;
    c.drawImage(
      sprite,
      Math.round(canvas.width / 2 - w / 2),
      Math.round(canvas.height - 18 - h + bob),
      Math.round(w),
      Math.round(h)
    );
  }
  // Portrait : la tête du héros, de face (le haut du sprite, cornes comprises).
  function drawFace(canvas, look) {
    if (!canvas || typeof canvas.getContext !== 'function' || typeof canaanHeroSprite !== 'function') return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const sprite = canaanHeroSprite({ ...look, wear: '' }, 0, 0, { tool: 'none' });
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = false;
    c.drawImage(sprite, 4, 0, 44, 30, 0, 0, canvas.width, canvas.height);
  }
  function drawPortraits() {
    const menu = document.getElementById('slotMenu');
    for (const canvas of menu.querySelectorAll('canvas[data-portrait]')) {
      const race = LOOK_RACES[Number(canvas.dataset.portrait)];
      if (!race) continue;
      const tone = Math.max(0, lookRace(ui.look?.race).skins.indexOf(ui.look?.skin));
      drawFace(canvas, sanitizeLook({ ...ui.look, race: race.id, skin: race.skins[tone] }));
    }
    for (const canvas of menu.querySelectorAll('canvas[data-face-slot]')) {
      const info = summaries.find(s => s.slot === Number(canvas.dataset.faceSlot));
      if (info?.look) drawFace(canvas, info.look);
    }
  }
  // Animation : le héros en création marche sur place ; celui de la sélection respire.
  let previewFrame = 0;
  let summaries = [];
  const selectedInfo = () => summaries.find(s => s.slot === ui.selected && occupied(s)) || null;
  function drawPreview() {
    if (ui.lookFor) {
      drawHero(document.getElementById('lookPreview'), ui.look, previewFrame % 4);
      return;
    }
    const info = selectedInfo();
    if (info?.look)
      drawHero(document.getElementById('selectPreview'), info.look, 0, previewFrame % 4 < 2 ? 0 : 2);
  }
  setInterval(() => {
    if (started) return;
    previewFrame++;
    drawPreview();
  }, 220);
  // Garde ce qui est tapé (nom, formulaire pour rejoindre) avant de reconstruire le menu.
  function keepTyped() {
    const value = id => document.getElementById(id)?.value;
    if (ui.lookFor === 'slot' && typeof value('slotName') === 'string') ui.name = value('slotName');
    if (ui.lookFor === 'slot' && typeof value('heroName') === 'string') ui.heroName = value('heroName');
  }
  function lookSet(key, index) {
    keepTyped();
    const lists = {
      sex: LOOK_SEXES.map(x => x.id),
      race: LOOK_RACES.map(x => x.id),
      skin: (LOOK_RACES.find(r => r.id === ui.look.race) || LOOK_RACES[0]).skins,
      hairStyle: LOOK_HAIR_STYLES.map(x => x.id),
      hair: LOOK_HAIR_COLORS,
      eyes: LOOK_EYE_COLORS,
      outfit: LOOK_OUTFITS.map(x => x.id)
    };
    const list = Object.hasOwn(lists, key) ? lists[key] : null;
    if (!list || !Number.isInteger(index) || index < 0 || index >= list.length) return false;
    const next = { ...ui.look, [key]: list[index] };
    // Changer de race garde la même position de teinte dans la nouvelle palette.
    if (key === 'race') {
      const before = (LOOK_RACES.find(r => r.id === ui.look.race) || LOOK_RACES[0]).skins.indexOf(
        ui.look.skin
      );
      next.skin = LOOK_RACES[index].skins[Math.max(0, before)];
    }
    ui.look = sanitizeLook(next);
    render();
    return true;
  }
  // Décor de l'écran titre : celui de la race (styles/slot-menu.css), ou la nuit de pleine lune par défaut.
  function setScene(race) {
    const title = document.getElementById('title');
    if (title?.dataset) title.dataset.scene = race ? lookRace(race).id : '';
  }
  function render() {
    const menu = document.getElementById('slotMenu');
    menu.hidden = false;
    const title = document.getElementById('title');
    if (title?.classList) title.classList.toggle('creating', !!ui.lookFor);
    if (ui.lookFor) {
      setScene(ui.look.race);
      menu.innerHTML =
        creator() + (ui.message ? '<p class="slot-message" role="status">' + esc(ui.message) + '</p>' : '');
      const input = document.getElementById('heroName') || document.getElementById('slotName');
      if (ui.focusName && input && typeof input.focus === 'function') {
        input.focus();
        if (typeof input.select === 'function') input.select();
      }
      ui.focusName = false;
      drawPortraits();
      drawPreview();
      return;
    }
    summaries = [];
    for (let slot = 1; slot <= CANAAN_SLOT_COUNT; slot++) summaries.push(CANAAN_PERSISTENCE.summary(slot));
    // Le slot affiché reste celui choisi tant qu'il existe ; sinon, la première aventure.
    if (!selectedInfo()) ui.selected = summaries.find(occupied)?.slot ?? null;
    setScene(selectedInfo()?.look?.race);
    const info = selectedInfo(),
      confirming = summaries.find(s => s.slot === ui.confirming && s.state === 'aventure');
    menu.innerHTML =
      '<div class="cs-screen">' +
      stage(info) +
      '<aside class="cs-roster" aria-label="Aventures"><h2 class="cs-roster-title">Aventures</h2><div class="slot-list">' +
      summaries.map(card).join('') +
      '</div>' +
      (confirming ? confirmBox(confirming) : '') +
      (CANAAN_SAVE_STORE.openFolder
        ? '<button type="button" class="slot-folder" data-action="openSaveFolder">📂 Ouvrir le dossier des sauvegardes</button>'
        : '') +
      '<div class="cs-social">' +
      joinArea() +
      '</div></aside>' +
      (confirming ? '<div class="cs-enter"></div>' : enterBar(info)) +
      (ui.message ? '<p class="slot-message" role="status">' + esc(ui.message) + '</p>' : '') +
      '</div>';
    drawPortraits();
    drawPreview();
  }
  // Rejoindre la partie d'un ami : pseudo, code du salon et adresse du relais.
  function joinArea() {
    const st = CANAAN_NET.state(),
      me = { ...CANAAN_NET.settings(), ...(ui.draft || {}) };
    if (!ui.joining)
      return '<button type="button" class="slot-join-open" data-action="netJoinForm">🌐 Rejoindre la partie d’un ami</button>';
    return (
      '<div class="slot-join"><h3>Rejoindre la partie d’un ami</h3>' +
      '<label for="joinInvite">Invitation reçue (colle-la ici)</label><input id="joinInvite" class="slot-input" autocomplete="off" placeholder="Rejoins ma partie The Legend of Nashi ! Relais : wss://… · Code : …">' +
      '<label for="joinPseudo">Pseudo</label><input id="joinPseudo" class="slot-input" maxlength="24" autocomplete="off" value="' +
      esc(me.pseudo === 'Invité' ? '' : me.pseudo) +
      '">' +
      '<label for="joinCode">Code du salon</label><input id="joinCode" class="slot-input" maxlength="8" autocomplete="off" placeholder="ABC234" value="' +
      esc(me.code) +
      '">' +
      '<label for="joinRelay">Relais</label><input id="joinRelay" class="slot-input" autocomplete="off" value="' +
      esc(me.relay) +
      '">' +
      '<button type="button" class="slot-secondary slot-join-look" data-action="lookEditJoin">🎨 Apparence de mon héros</button>' +
      '<div class="slot-actions"><button type="button" class="slot-primary" data-action="netJoin">Rejoindre</button>' +
      '<button type="button" class="slot-secondary" data-action="cancelSlotMenu">Annuler</button></div>' +
      (st.status ? '<p class="slot-message" role="status">' + esc(st.status) + '</p>' : '') +
      '</div>'
    );
  }
  function reset(message = '') {
    ui.joining = false;
    ui.lookFor = null;
    ui.look = null;
    ui.draft = null;
    ui.creating = null;
    ui.confirming = null;
    ui.message = message;
    render();
  }
  // Ouvrir une aventure : le slot est retenu pour le prochain chargement de la page.
  function play(slot) {
    if (!CANAAN_PERSISTENCE.validSlot(slot)) return false;
    if (!CANAAN_PERSISTENCE.setPending(slot)) {
      reset('Impossible d’ouvrir cette aventure : stockage de session indisponible.');
      return false;
    }
    // L'écran de chargement couvre tout jusqu'au rechargement, puis jusqu'à ce que le monde soit prêt.
    canaanBootLoader.show('Ouverture de l’aventure…');
    window.location.reload();
    return true;
  }
  function create(slot) {
    keepTyped();
    let ok = false;
    try {
      ok = CANAAN_PERSISTENCE.createSlot(slot, ui.name, ui.look, ui.classe, ui.heroName);
    } catch (error) {
      console.error('[CANAAN] Création de l’aventure impossible', error);
    }
    if (!ok) {
      reset('Impossible de créer l’aventure dans ce slot.');
      return false;
    }
    ui.lookFor = null;
    ui.look = null;
    ui.creating = null;
    return play(slot);
  }
  function remove(slot) {
    let ok = false;
    try {
      ok = CANAAN_PERSISTENCE.deleteSlot(slot);
    } catch (error) {
      console.error('[CANAAN] Suppression impossible', error);
    }
    reset(
      ok
        ? 'Aventure supprimée. Une copie de secours a été gardée.'
        : 'Suppression impossible : l’aventure est conservée.'
    );
    return ok;
  }
  // Entrée valide la création ; Échap annule.
  document.getElementById('slotMenu').addEventListener('keydown', event => {
    if (event.target?.id !== 'slotName' && event.target?.id !== 'heroName') return;
    if (event.key === 'Enter') create(ui.creating);
    else if (event.key === 'Escape') reset();
    event.stopPropagation();
  });
  // Invitation collée : le relais et le code du salon se remplissent tout seuls.
  document.getElementById('slotMenu').addEventListener('input', event => {
    if (event.target?.id !== 'joinInvite') return;
    const found = parseInvitation(event.target.value);
    if (found.relay && document.getElementById('joinRelay'))
      document.getElementById('joinRelay').value = found.relay;
    if (found.code && document.getElementById('joinCode'))
      document.getElementById('joinCode').value = found.code;
  });
  // L'état de la connexion s'affiche dans le formulaire tant que l'écran titre est visible.
  window.addEventListener('canaan-net', () => {
    if (!started && ui.joining && !ui.lookFor) render();
  });
  // Sauvegarde automatique toutes les 45 secondes en jeu, et à la fermeture de la fenêtre.
  const AUTOSAVE_MS = 45000;
  setInterval(() => {
    if (started && !P.dead) saveGame();
  }, AUTOSAVE_MS);
  addEventListener('beforeunload', () => {
    if (started) saveGame();
  });
  window.CANAAN_SLOT_MENU = Object.freeze({
    render,
    play,
    // Héros affiché sur la scène de sélection.
    select(slot) {
      if (!CANAAN_PERSISTENCE.validSlot(slot)) return false;
      ui.selected = slot;
      ui.confirming = null;
      ui.message = '';
      render();
      return true;
    },
    newSlot(slot) {
      ui.creating = slot;
      ui.confirming = null;
      ui.joining = false;
      ui.message = '';
      ui.lookFor = 'slot';
      ui.look = defaultLook();
      ui.face = 0;
      ui.name = 'Aventure ' + slot;
      ui.heroName = '';
      ui.focusName = true;
      render();
    },
    lookSet,
    classSet(id) {
      if (!classById(id)) return false;
      keepTyped();
      ui.classe = id;
      render();
      return true;
    },
    lookRandom() {
      keepTyped();
      ui.look = randomLook(Math.random);
      render();
    },
    lookTurn(dir) {
      keepTyped();
      ui.face = (((ui.face + (dir < 0 ? 3 : 1)) % 4) + 4) % 4;
      render();
    },
    // Héros d'invité : apparence gardée dans les préférences, envoyée en rejoignant.
    lookEditJoin() {
      const value = id => document.getElementById(id)?.value;
      ui.draft = {};
      for (const [id, key] of [
        ['joinPseudo', 'pseudo'],
        ['joinCode', 'code'],
        ['joinRelay', 'relay']
      ])
        if (typeof value(id) === 'string') ui.draft[key] = value(id);
      ui.lookFor = 'join';
      ui.look = decodeLook(CANAAN_NET.settings().look);
      ui.face = 0;
      ui.message = '';
      render();
    },
    lookSaveJoin() {
      CANAAN_NET.setLook(ui.look);
      ui.lookFor = null;
      ui.look = null;
      ui.message = 'Apparence enregistrée : tes amis la verront en jeu.';
      render();
    },
    lookBack() {
      ui.lookFor = null;
      ui.look = null;
      render();
    },
    create,
    askDelete(slot) {
      ui.confirming = slot;
      ui.selected = slot;
      ui.creating = null;
      ui.message = '';
      render();
    },
    remove,
    cancel: () => reset(),
    joinForm() {
      ui.joining = true;
      ui.lookFor = null;
      ui.creating = null;
      ui.confirming = null;
      render();
    },
    join() {
      const value = id => document.getElementById(id)?.value || '';
      ui.draft = null;
      CANAAN_NET.joinRoom({
        relay: value('joinRelay').trim(),
        code: value('joinCode'),
        pseudo: value('joinPseudo')
      });
      render();
    },
    openFolder() {
      if (CANAAN_SAVE_STORE.openFolder) CANAAN_SAVE_STORE.openFolder();
    },
    autosaveMs: AUTOSAVE_MS,
    state: () => ({ ...ui, look: ui.look ? { ...ui.look } : null })
  });
})();
