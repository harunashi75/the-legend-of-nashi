// Garde-robe (onglet des Collections, touche V, en journal de collection) : les apparences (transmogrification) trouvées en jouant, à porter par-dessus son équipement.
// Une apparence est une tenue complète, purement visuelle (shared/data/skins.js). Elle tombe des monstres, des élites,
// des boss (donjons, raids, boss cachés, boss mondiaux, Arène) et des coffres secrets, avec une qualité : plus elle
// est haute, plus la tenue est travaillée. Une apparence déjà possédée est revendue d'office.
// La collection est gardée par héros (hero.skins.owned) ; la tenue portée est dans son apparence (look.wear), donc
// sauvegardée, envoyée aux autres joueurs et dessinée par canaan-pixel-art.
(() => {
  'use strict';
  const ownedOf = hero => (hero.skins ||= { owned: [] }).owned;
  const has = (hero, id) => ownedOf(hero).includes(id);
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const rarityOf = sk => GEAR_RARITIES[sk.rarity] || GEAR_RARITIES[0];
  // Collection vérifiée : seulement des apparences connues, chacune une fois.
  function sanitize(raw) {
    const list = Array.isArray(raw?.owned) ? raw.owned : [];
    return { owned: [...new Set(list.filter(id => typeof id === 'string' && SKIN_IDS.includes(id)))] };
  }
  const exportOf = hero => ({ owned: [...ownedOf(hero)] });
  // Une apparence gagnée : nouvelle, elle rejoint la garde-robe ; déjà possédée, elle est revendue.
  function grant(hero, id) {
    const sk = skinById(id);
    if (!sk) return false;
    const r = rarityOf(sk);
    if (has(hero, id)) {
      const gold = SKIN_DUPLICATE_GOLD[sk.rarity] || 0;
      hero.player.gold += gold;
      canaanLootNotice(hero, '👗 Apparence déjà connue (' + sk.name + ') : revendue ' + gold + ' or.');
      return false;
    }
    ownedOf(hero).push(id);
    hero.netBag = null;
    canaanLootNotice(
      hero,
      (sk.rarity >= 4
        ? '🌟 ' + tt('APPARENCE {qualite} !', { qualite: translateText(r.name).toUpperCase() }) + ' '
        : '👗 Nouvelle apparence ' + r.name + ' : ') +
        sk.name +
        ' (touche V)'
    );
    return true;
  }
  // Tirage d'une apparence pour une source (SKIN_DROPS) ; renvoie son id ou null.
  function roll(source, rnd = Math.random) {
    const d = SKIN_DROPS[source];
    if (!d || rnd() >= d.chance) return null;
    const total = d.weights.reduce((a, b) => a + b, 0);
    let pick = rnd() * total,
      rarity = 0;
    for (; rarity < d.weights.length; rarity++) {
      pick -= d.weights[rarity];
      if (pick < 0) break;
    }
    // Les tenues de la cité elfique s'achètent : jamais tirées au butin.
    const pool = SKINS.filter(s => s.rarity === Math.min(rarity, 5) && !s.shop);
    return pool.length ? pool[Math.floor(rnd() * pool.length)].id : null;
  }
  // Chance d'apparence d'une source pour un héros : tirée, puis donnée.
  function drop(source, hero = game.hero) {
    const id = roll(source);
    return id ? grant(hero, id) || true : false;
  }
  // Porter une apparence possédée ('' : la tenue de création).
  function wear(hero, id) {
    if (id && !has(hero, id)) return false;
    hero.look = sanitizeLook({ ...hero.look, wear: id || '' });
    hero.netBag = null;
    return true;
  }
  // ---------------------------------------------------------------- Fenêtre
  const previews = new Map();
  function preview(look) {
    const key = encodeLook(look);
    if (previews.has(key)) return previews.get(key);
    const spr = canaanHeroSprite(look, 0, 0, { tool: 'none' }),
      cv = document.createElement('canvas');
    cv.width = 76;
    cv.height = 76;
    const g = cv.getContext('2d');
    if (!g || !g.drawImage) return '';
    g.imageSmoothingEnabled = false;
    const s = Math.min(76 / spr.width, 76 / spr.height);
    g.drawImage(spr, (76 - spr.width * s) / 2, (76 - spr.height * s) / 2, spr.width * s, spr.height * s);
    const url = cv.toDataURL ? cv.toDataURL() : '';
    previews.set(key, url);
    return url;
  }
  // Ouverte : la fenêtre affichée est Collections (V) sur son onglet Garde-robe (toute autre fenêtre efface cette
  // marque, voir showPanel).
  const shown = () => CANAAN_COLLECTIONS.current() === 'wardrobe';
  const count = () => ownedOf(game.hero).length;
  // Où trouver une apparence : les sources de butin qui tirent sa qualité (SKIN_DROPS), ou la boutique de la Tisseuse
  // pour les tenues elfiques. Chaque source est une étiquette à part (traduite seule).
  const SOURCE_NAMES = {
    normal: 'Monstres',
    elite: 'Élites',
    dungeon: 'Boss de donjon',
    raid: 'Boss de raid',
    secretBoss: 'Boss cachés',
    worldBoss: 'Boss mondiaux',
    secretChest: 'Coffres secrets',
    arenaBoss: 'Boss de l’Arène'
  };
  const chip = text => '<span class="collection-chip">' + esc(text) + '</span>';
  function sources(sk) {
    if (sk.shop)
      return chip('Elwyn, la Tisseuse') + chip('Sylvaëlle, la Cité des Elfes') + chip(sk.shop + ' or');
    return Object.entries(SKIN_DROPS)
      .filter(([, d]) => d.weights[sk.rarity] > 0)
      .map(([key]) => chip(SOURCE_NAMES[key] || key))
      .join('');
  }
  // Onglet Garde-robe des Collections (V), en journal de collection : la liste à gauche (la tenue
  // d'origine, les apparences obtenues en couleur, puis les autres grisées), l'apparence sélectionnée en grand à
  // droite, portée par le héros, avec où la trouver.
  let picked = null; // apparence affichée à droite ('' : la tenue d'origine) — interface locale
  const ORIGIN = { id: '', name: 'Tenue d’origine', rarity: 0 };
  function pick(id) {
    picked = id === '' || skinById(id) ? id : null;
    render();
  }
  function section() {
    const hero = game.hero,
      owned = ownedOf(hero),
      worn = hero.look?.wear || '';
    if (picked === null || (picked && !skinById(picked))) picked = worn;
    const mine = sk => sk === ORIGIN || owned.includes(sk.id),
      list = [
        ORIGIN,
        ...SKINS.filter(sk => owned.includes(sk.id)),
        ...SKINS.filter(sk => !owned.includes(sk.id))
      ],
      item = sk => {
        const r = rarityOf(sk),
          ok = mine(sk),
          img = preview({ ...hero.look, wear: sk.id });
        return (
          '<button type="button" class="collection-item' +
          (ok ? ' owned' : ' locked') +
          (sk.id === picked ? ' picked' : '') +
          '" style="--rarity:' +
          (sk === ORIGIN ? '#d8d0c0' : r.color) +
          '" data-action="wardrobePick" data-skin="' +
          sk.id +
          '">' +
          (img ? '<img alt="" src="' + img + '">' : '<span>👗</span>') +
          '<span class="collection-name"><b>' +
          esc(sk.name) +
          '</b><small>' +
          esc(sk === ORIGIN ? 'Ta tenue de création' : r.name) +
          (worn === sk.id ? ' · ' + esc('portée') : '') +
          '</small></span><span class="collection-mark">' +
          (!ok ? '🔒' : worn === sk.id ? '★' : '') +
          '</span></button>'
        );
      };
    const sk = picked ? skinById(picked) : ORIGIN,
      r = rarityOf(sk),
      ok = mine(sk),
      col = sk === ORIGIN ? '#d8d0c0' : r.color,
      big = preview({ ...hero.look, wear: sk.id });
    let action;
    if (!ok) action = '<span class="collection-lock">🔒 ' + esc('Pas encore obtenue') + '</span>';
    else if (worn === sk.id) action = '<b>' + esc('✔ Portée') + '</b>';
    else
      action =
        '<button type="button" data-action="wearSkin" data-skin="' +
        sk.id +
        '">' +
        esc(sk === ORIGIN ? 'Retirer l’apparence' : 'Porter') +
        '</button>';
    const view =
      '<div class="collection-view' +
      (ok ? '' : ' locked') +
      '" style="--rarity:' +
      col +
      '"' +
      canaanPrestige({ rarity: sk === ORIGIN ? 'Commun' : r.name }) +
      '><div class="collection-stage">' +
      (big ? '<img alt="" src="' + big + '">' : '<span>👗</span>') +
      '</div><h3 style="color:' +
      (ok ? col : '#9a948a') +
      '">' +
      esc(sk.name) +
      '</h3><p class="collection-sub">' +
      esc(sk === ORIGIN ? 'Ta tenue de création' : r.name) +
      '</p>' +
      (sk === ORIGIN
        ? ''
        : '<div class="collection-source">📍 <b>' +
          esc('Où l’obtenir') +
          '</b><div class="collection-chips">' +
          sources(sk) +
          '</div></div>') +
      '<div class="collection-actions">' +
      action +
      '</div></div>';
    return (
      '<div class="rpg-paper tab-paper wardrobe-tab"><div class="tab-head"><h3>👗 Garde-robe</h3><span>' +
      owned.length +
      ' / ' +
      SKINS.length +
      ' apparences</span></div>' +
      '<p class="muted">Des tenues complètes, purement visuelles, portées par-dessus ton équipement. Elles tombent des monstres, des boss (donjons, raids, boss cachés, boss mondiaux, Arène) et des coffres secrets ; plus la qualité est haute, plus la tenue est travaillée (ailes, aura, particules).</p>' +
      '<div class="collection"><div class="collection-list" data-keep-scroll="wardrobe"><div class="collection-head">' +
      esc('Apparences obtenues') +
      ' <b>' +
      owned.length +
      ' / ' +
      SKINS.length +
      '</b></div>' +
      list.map(item).join('') +
      '</div>' +
      view +
      '</div></div>'
    );
  }
  // Ouvre (ou redessine) les Collections sur leur onglet Garde-robe.
  function render() {
    window.canaanCollections('wardrobe');
  }
  function toggle() {
    if (shown()) return closePanels();
    render();
  }
  // Clic sur une apparence : l'hôte la met ; un invité la demande à l'hôte.
  function choose(id) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'skin-wear', id: id || '' });
    if (!wear(game.hero, id)) return false;
    saveGame();
    if (shown()) render();
    return true;
  }
  function handle(hero, action) {
    if (action.op !== 'skin-wear') return false;
    return wear(hero, typeof action.id === 'string' ? action.id : '');
  }
  // Invité : la garde-robe gardée chez l'hôte (fenêtre ouverte : rafraîchie).
  function applyRemote(raw) {
    game.hero.skins = sanitize(raw);
    if (shown()) render();
  }
  window.CANAAN_WARDROBE = Object.freeze({
    sanitize,
    export: exportOf,
    grant,
    roll,
    drop,
    wear,
    has,
    toggle,
    choose,
    handle,
    applyRemote,
    render,
    section,
    pick,
    count
  });
  window.toggleWardrobe = toggle;
})();
