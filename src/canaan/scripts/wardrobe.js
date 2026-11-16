// Garde-robe (touche V) : les apparences (transmogrification) trouvées en jouant, à porter par-dessus son équipement.
// Une apparence est une tenue complète, purement visuelle (shared/data/skins.js). Elle tombe des monstres, des élites,
// des boss (donjons, raids, boss cachés, boss mondiaux, Arène) et des coffres secrets, avec une qualité : plus elle
// est haute, plus la tenue est travaillée. Une apparence déjà possédée est revendue d'office.
// La collection est gardée par héros (hero.skins.owned) ; la tenue portée est dans son apparence (look.wear), donc
// sauvegardée, envoyée aux autres joueurs et dessinée par canaan-pixel-art.
(() => {
  'use strict';
  const ownedOf = hero => (hero.skins ||= { owned: [] }).owned;
  const has = (hero, id) => ownedOf(hero).includes(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
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
    canaanLootNotice(hero, (sk.rarity >= 4 ? '🌟 APPARENCE ' + r.name.toUpperCase() + ' ! ' : '👗 Nouvelle apparence ' + r.name + ' : ') + sk.name + ' (touche V)');
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
    const pool = SKINS.filter(s => s.rarity === Math.min(rarity, 5));
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
    const spr = canaanHeroSprite(look, 0, 0),
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
  let isOpen = false;
  function render() {
    const hero = game.hero,
      owned = ownedOf(hero),
      worn = hero.look?.wear || '',
      card = sk => {
        const r = rarityOf(sk),
          mine = owned.includes(sk.id),
          img = mine ? preview({ ...hero.look, wear: sk.id }) : '',
          on = worn === sk.id;
        return (
          '<button type="button" class="skin-card' + (mine ? '' : ' locked') + (on ? ' worn' : '') + '" style="--rarity:' + r.color + '"' + (mine ? ' data-action="wearSkin" data-skin="' + sk.id + '"' : '') + ' title="' + esc(mine ? sk.name + ' · ' + r.name : 'Apparence ' + r.name + ' à découvrir') + '"' + canaanPrestige({ rarity: r.name }) + '>' +
          (img ? '<img alt="" src="' + img + '">' : '<span class="skin-unknown">?</span>') +
          '<span class="skin-name">' + esc(mine ? sk.name : '???') + '</span><span class="skin-rarity">' + esc(r.name) + (on ? ' · portée' : '') + '</span></button>'
        );
      };
    modernPanel(
      rpgHeader('👗 Garde-robe — ' + owned.length + ' / ' + SKINS.length + ' apparences') +
        '<div class="modern-body"><p class="muted">Des tenues complètes, purement visuelles, portées par-dessus ton équipement. Elles tombent des monstres, des boss (donjons, raids, boss cachés, boss mondiaux, Arène) et des coffres secrets ; plus la qualité est haute, plus la tenue est travaillée (ailes, aura, particules). Clique pour porter.</p>' +
        '<div class="skin-current"><img alt="" src="' + preview(hero.look) + '"><div><b>' + esc(worn ? skinById(worn).name : 'Tenue d’origine') + '</b>' +
        (worn ? '<button type="button" data-action="wearSkin" data-skin="">Retirer l’apparence</button>' : '<span class="muted">Aucune apparence portée.</span>') + '</div></div>' +
        '<div class="skin-grid">' + SKINS.map(card).join('') + '</div></div>'
    );
    document.getElementById('window').dataset.canaanPanel = 'wardrobe';
    isOpen = true;
  }
  function toggle() {
    const win = document.getElementById('window');
    if (isOpen && win?.dataset.canaanPanel === 'wardrobe' && modalOpen()) {
      isOpen = false;
      return closePanels();
    }
    render();
  }
  // Clic sur une apparence : l'hôte la met ; un invité la demande à l'hôte.
  function choose(id) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'skin-wear', id: id || '' });
    if (!wear(game.hero, id)) return false;
    saveGame();
    if (isOpen && modalOpen()) render();
    return true;
  }
  function handle(hero, action) {
    if (action.op !== 'skin-wear') return false;
    return wear(hero, typeof action.id === 'string' ? action.id : '');
  }
  // Invité : la garde-robe gardée chez l'hôte (fenêtre ouverte : rafraîchie).
  function applyRemote(raw) {
    game.hero.skins = sanitize(raw);
    if (isOpen && modalOpen()) render();
  }
  window.CANAAN_WARDROBE = Object.freeze({ sanitize, export: exportOf, grant, roll, drop, wear, has, toggle, choose, handle, applyRemote, render });
  window.toggleWardrobe = toggle;
})();
