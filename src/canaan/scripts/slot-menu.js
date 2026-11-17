// Menu des aventures sur l'écran titre : trois slots (continuer, nouvelle aventure, supprimer).
// Choisir un slot recharge la page : chaque aventure démarre dans un état neuf, sans reste d'une autre.
(() => {
  'use strict';
  // Interface du menu : un seul slot à la fois en création ou en confirmation de suppression.
  // look : apparence en cours de création ; lookFor : 'slot' (nouvelle aventure) ou 'join' (héros d'invité).
  const ui = {
    creating: null,
    confirming: null,
    message: '',
    joining: false,
    look: null,
    lookFor: null,
    face: 0,
    name: '',
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
  function card(info) {
    const n = info.slot;
    if (info.state === 'aventure') {
      const guests = info.invites.length ? ' · Invités : ' + esc(info.invites.join(', ')) : '';
      if (ui.confirming === n)
        return (
          '<article class="slot-card confirm"><h3>' +
          esc(info.nom) +
          '</h3><p class="slot-warning">Supprimer cette aventure ? Le monde' +
          (info.invites.length
            ? ' et les héros de tes invités (' + esc(info.invites.join(', ')) + ') seront perdus.'
            : ' et ton héros seront perdus.') +
          ' Une copie de secours est gardée dans le dossier des sauvegardes.</p>' +
          '<div class="slot-actions"><button type="button" class="slot-danger" data-action="confirmDeleteSlot" data-slot="' +
          n +
          '">Supprimer définitivement</button><button type="button" class="slot-secondary" data-action="cancelSlotMenu">Annuler</button></div></article>'
        );
      return (
        '<article class="slot-card"><span class="slot-number">Slot ' +
        n +
        '</span><h3>' +
        esc(info.nom) +
        '</h3><p class="slot-meta">' +
        (classById(info.classe)
          ? classById(info.classe).icon + ' ' + esc(classById(info.classe).name) + ' · '
          : '') +
        'Niveau ' +
        info.level +
        ' · ' +
        info.gold.toLocaleString('fr-FR') +
        ' or' +
        guests +
        '</p><p class="slot-date">' +
        (info.updated ? 'Dernière partie : ' + esc(when(info.updated)) : '') +
        '</p><div class="slot-actions"><button type="button" class="slot-primary" data-action="playSlot" data-slot="' +
        n +
        '">Continuer</button><button type="button" class="slot-secondary" data-action="askDeleteSlot" data-slot="' +
        n +
        '">Supprimer</button></div></article>'
      );
    }
    if (info.state === 'illisible')
      return (
        '<article class="slot-card broken"><span class="slot-number">Slot ' +
        n +
        '</span><h3>Sauvegarde illisible</h3><p class="slot-meta">Ouvre-la pour proposer « Repartir à neuf » (une copie est gardée), ou supprime-la.</p>' +
        '<div class="slot-actions"><button type="button" class="slot-primary" data-action="playSlot" data-slot="' +
        n +
        '">Ouvrir</button><button type="button" class="slot-secondary" data-action="askDeleteSlot" data-slot="' +
        n +
        '">Supprimer</button></div></article>'
      );
    if (ui.creating === n)
      return (
        '<article class="slot-card empty creating"><span class="slot-number">Slot ' +
        n +
        '</span><h3>Nouvelle aventure</h3><label class="slot-label" for="slotName">Nom de l’aventure</label>' +
        '<input id="slotName" class="slot-input" type="text" maxlength="32" autocomplete="off" value="Aventure ' +
        n +
        '"><div class="slot-actions"><button type="button" class="slot-primary" data-action="createSlot" data-slot="' +
        n +
        '">Créer</button><button type="button" class="slot-secondary" data-action="cancelSlotMenu">Annuler</button></div></article>'
      );
    return (
      '<article class="slot-card empty"><span class="slot-number">Slot ' +
      n +
      '</span><h3>Emplacement libre</h3><p class="slot-meta">Un nouveau monde et un nouveau héros.</p><div class="slot-actions"><button type="button" class="slot-primary" data-action="newSlot" data-slot="' +
      n +
      '">Nouvelle aventure</button></div></article>'
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
  function creator() {
    const look = ui.look,
      race = LOOK_RACES.find(r => r.id === look.race) || LOOK_RACES[0],
      forSlot = ui.lookFor === 'slot',
      outfit = lookOutfit(look.outfit);
    return (
      '<section class="look-creator" aria-label="Création du héros"><h3>' +
      (forSlot ? 'Nouvelle aventure · Slot ' + ui.creating : 'Mon héros d’invité') +
      '</h3><div class="look-body"><div class="look-stage"><canvas id="lookPreview" width="192" height="240" aria-label="Aperçu du héros"></canvas>' +
      '<div class="look-turn"><button type="button" class="slot-secondary" data-action="lookTurn" data-dir="-1" aria-label="Tourner à gauche">⟲</button>' +
      '<button type="button" class="slot-secondary" data-action="lookRandom">🎲 Au hasard</button>' +
      '<button type="button" class="slot-secondary" data-action="lookTurn" data-dir="1" aria-label="Tourner à droite">⟳</button></div>' +
      '<p class="look-summary">' +
      esc(LOOK_SEXES.find(x => x.id === look.sex).name + ' · ' + race.name + ' · ' + outfit.name) +
      '</p></div>' +
      '<div class="look-fields">' +
      (forSlot
        ? '<label class="slot-label" for="slotName">Nom de l’aventure</label><input id="slotName" class="slot-input" type="text" maxlength="32" autocomplete="off" value="' +
          esc(ui.name) +
          '">'
        : '') +
      lookRow('Sexe', 'sex', LOOK_SEXES, look.sex) +
      lookRow('Race', 'race', LOOK_RACES, look.race) +
      lookRow(race.id === 'minotaure' ? 'Pelage' : 'Peau', 'skin', race.skins, look.skin, true) +
      lookRow('Coiffure', 'hairStyle', LOOK_HAIR_STYLES, look.hairStyle) +
      lookRow('Cheveux', 'hair', LOOK_HAIR_COLORS, look.hair, true) +
      lookRow('Yeux', 'eyes', LOOK_EYE_COLORS, look.eyes, true) +
      lookRow('Tenue', 'outfit', LOOK_OUTFITS, look.outfit, true) +
      '<p class="look-note">L’apparence est purement visuelle : aucune race n’est plus forte qu’une autre.</p>' +
      (forSlot ? classRow() : '') +
      '<div class="slot-actions">' +
      (forSlot
        ? '<button type="button" class="slot-primary" data-action="createSlot" data-slot="' +
          ui.creating +
          '">Créer l’aventure</button>'
        : '<button type="button" class="slot-primary" data-action="lookSaveJoin">Enregistrer mon héros</button>') +
      '<button type="button" class="slot-secondary" data-action="' +
      (forSlot ? 'cancelSlotMenu' : 'lookBack') +
      '">' +
      (forSlot ? 'Annuler' : 'Retour') +
      '</button></div>' +
      '</div></div></section>'
    );
  }
  // Classe du héros (changeable ensuite gratuitement au Camp de l'Aurore).
  function classRow() {
    const chosen = classById(ui.classe) || CLASSES[0];
    return (
      '<div class="look-row"><span class="look-title">Classe</span><div class="look-options">' +
      CLASSES.map(
        c =>
          '<button type="button" class="look-choice' +
          (c.id === chosen.id ? ' on' : '') +
          '" data-action="classSet" data-class="' +
          c.id +
          '">' +
          c.icon +
          ' ' +
          esc(c.name) +
          '</button>'
      ).join('') +
      '</div></div><p class="look-note class-pick"><b>' +
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
  // Aperçu animé : le héros marche sur place dans la direction choisie.
  let previewFrame = 0;
  function drawPreview() {
    const canvas = document.getElementById('lookPreview');
    if (
      !canvas ||
      !ui.look ||
      typeof canvas.getContext !== 'function' ||
      typeof canaanHeroSprite !== 'function'
    )
      return;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = false;
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath();
    c.ellipse(canvas.width / 2, canvas.height - 26, 54, 12, 0, 0, Math.PI * 2);
    c.fill();
    const sprite = canaanHeroSprite(ui.look, ui.face, previewFrame % 4, { tool: 'none' }),
      scale = ui.look.race === 'minotaure' ? 3.9 : 3.5,
      w = 52 * scale,
      h = 64 * scale;
    c.drawImage(
      sprite,
      Math.round(canvas.width / 2 - w / 2),
      Math.round(canvas.height - 18 - h),
      Math.round(w),
      Math.round(h)
    );
  }
  setInterval(() => {
    if (started || !ui.look || !ui.lookFor) return;
    previewFrame++;
    drawPreview();
  }, 220);
  // Garde ce qui est tapé (nom, formulaire pour rejoindre) avant de reconstruire le menu.
  function keepTyped() {
    const value = id => document.getElementById(id)?.value;
    if (ui.lookFor === 'slot' && typeof value('slotName') === 'string') ui.name = value('slotName');
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
  function render() {
    const menu = document.getElementById('slotMenu');
    menu.hidden = false;
    if (ui.lookFor) {
      menu.innerHTML =
        creator() + (ui.message ? '<p class="slot-message" role="status">' + esc(ui.message) + '</p>' : '');
      const input = document.getElementById('slotName');
      if (ui.focusName && input && typeof input.focus === 'function') {
        input.focus();
        if (typeof input.select === 'function') input.select();
      }
      ui.focusName = false;
      drawPreview();
      return;
    }
    const cards = [];
    for (let slot = 1; slot <= CANAAN_SLOT_COUNT; slot++) cards.push(card(CANAAN_PERSISTENCE.summary(slot)));
    menu.innerHTML =
      '<div class="slot-list">' +
      cards.join('') +
      '</div>' +
      (ui.message ? '<p class="slot-message" role="status">' + esc(ui.message) + '</p>' : '') +
      (CANAAN_SAVE_STORE.openFolder
        ? '<button type="button" class="slot-folder" data-action="openSaveFolder">📂 Ouvrir le dossier des sauvegardes</button>'
        : '') +
      joinArea();
    const input = document.getElementById('slotName');
    if (ui.creating !== null && input && typeof input.focus === 'function') {
      input.focus();
      if (typeof input.select === 'function') input.select();
    }
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
    const input = document.getElementById('slotName');
    let ok = false;
    try {
      ok = CANAAN_PERSISTENCE.createSlot(slot, input ? input.value : ui.name, ui.look, ui.classe);
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
    if (event.target?.id !== 'slotName') return;
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
    newSlot(slot) {
      ui.creating = slot;
      ui.confirming = null;
      ui.joining = false;
      ui.message = '';
      ui.lookFor = 'slot';
      ui.look = defaultLook();
      ui.face = 0;
      ui.name = 'Aventure ' + slot;
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
