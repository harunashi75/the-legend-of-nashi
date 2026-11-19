// Sac unifié : chaque chose possédée est un objet du sac (touche I). En plus de l'équipement (hero.inventory), les
// poissons, les viandes et les repas y sont des piles de 100 au plus par case, et prennent de la place ; les Rubis
// non équipés sont aussi des piles, mais rangés à part, dans l'onglet Rubis de la fiche (C), et liés au héros :
// ils ne se vendent pas, ne se rangent pas à la banque et ne s'échangent pas ; les clés des secrets (boss cachés des donjons), des piles de 20. Leurs quantités restent rangées où le jeu les utilise (hero.rubis.owned, hero.prof.fish / meat /
// meals) : le sac en est la vue, sans changer les sauvegardes ni l'état envoyé aux invités.
// Une pile se désigne par un repère texte « genre:id:qualité*nombre » (fish:gardon:2*30, rubis:phenix:0*1), utilisé
// par la vente au marchand et par l'échange entre joueurs.
(() => {
  'use strict';
  const STACK = 100;
  // Taille d'une pile selon le genre (100 par défaut ; clés des secrets : 20).
  const STACK_OF = { key: 20 };
  const stackOf = kind => STACK_OF[kind] || STACK;
  // Trois sections : le sac (équipement, repas, enchantements, clés, trésors déterrés), les matériaux qu'on récolte
  // (minerais, poissons, herbes, viandes, poudres d'enchantement), avec leur propre place : MAT_LIMIT cases, sans prendre celles du sac, et les
  // Rubis, une collection sans limite de place (onglet Rubis de la fiche C).
  const MAT_KINDS = new Set(['fish', 'meat', 'ore', 'herb', 'dust']);
  const MAT_LIMIT = 100;
  const isMat = kind => MAT_KINDS.has(kind);
  const sectionOf = kind => (kind === 'rubis' ? 'rubis' : isMat(kind) ? 'mat' : 'main');
  const KINDS = ['rubis', 'fish', 'meat', 'meal', 'ore', 'herb', 'ench', 'key', 'treasure', 'dust'];
  // Rubriques du sac (touche I) : l'équipement (hero.inventory), les utilitaires (clés, repas, enchantements) et le
  // reste (trésors déterrés), dans la place du sac ; puis les matériaux, dans la leur.
  const CATEGORY = { key: 'util', meal: 'util', ench: 'util', treasure: 'other' };
  const categoryOf = kind => (kind === 'rubis' ? 'rubis' : isMat(kind) ? 'mat' : CATEGORY[kind] || 'other');
  // Ordre d'affichage des piles : par genre (dans cet ordre), la meilleure qualité d'abord, puis par nom.
  const KIND_ORDER = ['key', 'meal', 'ench', 'treasure', 'dust', 'ore', 'herb', 'fish', 'meat', 'rubis'];
  const byKind = (a, b) =>
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
    b.q - a.q ||
    info(a).name.localeCompare(info(b).name, 'fr') ||
    b.n - a.n;
  // Trier l'équipement du sac (bouton Trier) : par emplacement (armes d'abord), la meilleure qualité, puis le plus
  // haut niveau, puis par nom. L'ordre est celui de hero.inventory : il est gardé dans la sauvegarde.
  const SLOT_ORDER = ['weapon', 'helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring', 'artifact'];
  const slotRank = item =>
    SLOT_ORDER.includes(item.slot) ? SLOT_ORDER.indexOf(item.slot) : SLOT_ORDER.length;
  // Une arme liée (Relique) passe devant les qualités du tirage.
  const rarityRank = item => {
    const r = rarityInfo(item),
      i = GEAR_RARITIES.indexOf(r);
    return i < 0 ? GEAR_RARITIES.length : i;
  };
  function sortGear(hero) {
    const inv = hero.inventory;
    if (!Array.isArray(inv) || inv.length < 2) return false;
    const before = inv.map(it => it.id).join();
    inv.sort(
      (a, b) =>
        slotRank(a) - slotRank(b) ||
        rarityRank(b) - rarityRank(a) ||
        itemLevel(b) - itemLevel(a) ||
        String(gearDisplayName(a)).localeCompare(String(gearDisplayName(b)), 'fr')
    );
    hero.netBag = null;
    return inv.map(it => it.id).join() !== before;
  }
  const PROF_BAG = {
    fish: 'fish',
    meat: 'meat',
    meal: 'meals',
    ore: 'ore',
    herb: 'herb',
    ench: 'ench',
    treasure: 'treasure',
    dust: 'dust'
  };
  // Prix de vente d'une unité au marchand, selon le genre et la qualité (0 à 7).
  const UNIT_PRICE = {
    fish: q => 4 + 4 * q,
    meat: q => 5 + 5 * q,
    meal: q => 10 + 8 * q,
    rubis: () => 300,
    ore: q => 6 + 5 * q,
    herb: q => 4 + 4 * q,
    ench: q => 60 + 40 * q,
    key: () => 0,
    // Trésor déterré et poudre : leur prix est dans leur catalogue (unitPrice).
    treasure: () => 1,
    dust: () => 1
  };
  // Les Rubis sont liés au héros : ni vente, ni banque, ni échange. Les clés des secrets ne se vendent pas.
  const bound = p => p.kind === 'rubis';
  const sellable = p => p.kind !== 'key' && !bound(p);
  const profOf = hero => hero.prof || (hero.prof = profFresh());
  // Qualités : les mêmes noms et couleurs que l'équipement (Commun à Mythique).
  const qualityName = q => GEAR_RARITIES[q]?.name || 'Commun';
  const qualityColor = q => GEAR_RARITIES[q]?.color || '#aeb4c0';
  const rubisOf = hero => hero.rubis || { owned: {}, equipped: [] };

  // ---------------------------------------------------------------- Lecture
  // Quantité d'une pile (Rubis : ceux qui ne sont pas équipés).
  function count(hero, kind, id, q = 0) {
    if (kind === 'key')
      return id === 'secret' && !q ? Math.max(0, Math.floor(Number(hero.player?.keys) || 0)) : 0;
    if (kind === 'rubis') {
      const r = rubisOf(hero);
      return Math.max(0, (r.owned[id] || 0) - (r.equipped.includes(id) ? 1 : 0));
    }
    const store = profOf(hero)[PROF_BAG[kind]];
    return store ? store[id + ':' + q] || 0 : 0;
  }
  // Toutes les piles du héros (une entrée par genre, id et qualité), avant découpage en cases de 100.
  function piles(hero) {
    const out = [];
    const r = rubisOf(hero);
    for (const id of Object.keys(r.owned || {}).sort()) {
      const n = count(hero, 'rubis', id);
      if (n > 0) out.push({ kind: 'rubis', id, q: 0, n });
    }
    const keys = count(hero, 'key', 'secret');
    if (keys > 0) out.push({ kind: 'key', id: 'secret', q: 0, n: keys });
    const prof = profOf(hero);
    for (const kind of ['fish', 'meat', 'meal', 'ore', 'herb', 'ench', 'treasure', 'dust'])
      for (const [key, n] of Object.entries(prof[PROF_BAG[kind]] || {}).sort()) {
        const [id, q] = key.split(':');
        if (n > 0) out.push({ kind, id, q: Number(q) || 0, n });
      }
    return out;
  }
  // Cases occupées par les piles (une pile de 230 prend 3 cases : 100, 100, 30). section : 'main' (le sac),
  // 'mat' (les matériaux), 'rubis' (les Rubis non équipés), ou rien (toutes).
  // category : une rubrique du sac ('util', 'other', 'mat'), à la place d'une section ; les piles sont alors rangées
  // dans l'ordre d'affichage (byKind).
  function tiles(hero, section, category) {
    const out = [];
    const list = category ? piles(hero).sort(byKind) : piles(hero);
    for (const p of list) {
      if (section && section !== sectionOf(p.kind)) continue;
      if (category && category !== categoryOf(p.kind)) continue;
      for (let left = p.n, size = stackOf(p.kind); left > 0; left -= size)
        out.push({ ...p, n: Math.min(size, left) });
    }
    return out;
  }
  const tilesFor = (n, kind) => Math.ceil(Math.max(0, n) / stackOf(kind));
  // Cases du sac : l'équipement et les piles qui ne sont pas des matériaux.
  function used(hero) {
    return (hero.inventory || []).length + tiles(hero, 'main').length;
  }
  const matUsed = hero => tiles(hero, 'mat').length;
  function free(hero, kind) {
    const section = sectionOf(kind);
    if (section === 'rubis') return Infinity;
    return section === 'mat' ? MAT_LIMIT - matUsed(hero) : canaanBagLimit(hero) - used(hero);
  }
  // Peut-on ajouter n unités à cette pile ? Seules les cases supplémentaires demandent de la place, dans sa section.
  function room(hero, kind, id, q = 0, n = 1) {
    const now = count(hero, kind, id, q);
    return tilesFor(now + n, kind) - tilesFor(now, kind) <= free(hero, kind);
  }

  // ---------------------------------------------------------------- Écriture
  function add(hero, kind, id, q, n) {
    if (!(n > 0)) return;
    if (kind === 'key') hero.player.keys = count(hero, 'key', 'secret') + n;
    else if (kind === 'rubis') {
      const r = (hero.rubis ||= { owned: {}, equipped: [null, null, null, null, null, null] });
      r.owned[id] = (r.owned[id] || 0) + n;
    } else {
      const store = (profOf(hero)[PROF_BAG[kind]] ||= {}),
        key = id + ':' + q;
      store[key] = (store[key] || 0) + n;
    }
    hero.netBag = null;
  }
  function remove(hero, kind, id, q, n) {
    if (!(n > 0) || count(hero, kind, id, q) < n) return false;
    if (kind === 'key') hero.player.keys = count(hero, 'key', 'secret') - n;
    else if (kind === 'rubis') {
      const r = rubisOf(hero);
      r.owned[id] -= n;
      if (r.owned[id] <= 0) delete r.owned[id];
    } else {
      const store = profOf(hero)[PROF_BAG[kind]],
        key = id + ':' + q;
      store[key] -= n;
      if (store[key] <= 0) delete store[key];
    }
    hero.netBag = null;
    return true;
  }

  // ---------------------------------------------------------------- Repères (vente, échange)
  const TOKEN = /^(rubis|fish|meat|meal|ore|herb|ench|key|treasure|dust):([a-z_]{2,32}):([0-7])\*(\d{1,3})$/;
  const token = (p, n = p.n) => p.kind + ':' + p.id + ':' + p.q + '*' + n;
  function parse(text) {
    const m = TOKEN.exec(String(text || ''));
    if (!m) return null;
    const n = Number(m[4]);
    if (n < 1 || n > stackOf(m[1])) return null;
    const p = { kind: m[1], id: m[2], q: Number(m[3]), n };
    return known(p) ? p : null;
  }
  // Une pile existe dans les catalogues du jeu.
  function known(p) {
    if (!KINDS.includes(p.kind)) return false;
    if (p.kind === 'key') return p.id === 'secret' && p.q === 0;
    if (p.kind === 'rubis') return !!RUBIS_CATALOG.find(r => r.id === p.id) && p.q === 0;
    const cat = {
      fish: CANAAN_PROF.FISH,
      meat: CANAAN_PROF.MEAT,
      meal: CANAAN_PROF.RECIPES,
      ore: CANAAN_GATHER.ORES,
      herb: CANAAN_GATHER.HERBS,
      ench: CANAAN_GATHER.ENCHANTS,
      treasure: PROF_TREASURES,
      dust: PROF_DUSTS
    }[p.kind];
    // Un enchantement a un rang de 0 à 5 (le métal), pas une qualité ; un trésor ou une poudre n'a pas de qualité.
    return (
      Object.hasOwn(cat, p.id) &&
      (p.kind !== 'ench' || p.q <= 5) &&
      ((p.kind !== 'treasure' && p.kind !== 'dust') || p.q === 0)
    );
  }
  const isToken = text => TOKEN.test(String(text || ''));

  // ---------------------------------------------------------------- Présentation
  function info(p) {
    if (p.kind === 'key')
      return {
        name: 'Clé des secrets',
        icon: '🗝️',
        color: '#f0c040',
        sub: 'Clé · piles de 20',
        desc: 'Ouvre un coffre secret de l’île ou des Tréfonds (E devant le coffre). Les boss cachés des donjons et des raids en donnent une à chaque héros.',
        quality: null
      };
    if (p.kind === 'treasure') {
      const t = PROF_TREASURES[p.id];
      return {
        name: t.name,
        icon: t.icon,
        color: '#e8c070',
        sub: 'Trésor déterré',
        desc: 'Trouvé en creusant avec la pelle. Le marchand le rachète ' + t.value + ' or.',
        quality: null
      };
    }
    if (p.kind === 'dust') {
      const d = PROF_DUSTS[p.id];
      return {
        name: d.name,
        icon: d.icon,
        color: d.color,
        sub: 'Poudre d’enchantement',
        desc: 'Obtenue en démantelant un équipement (bouton ⚒ du sac). L’enchanteur s’en sert, avec les minerais, pour forger les enchantements des métaux rares et pour changer la statistique d’un enchantement posé.',
        quality: null
      };
    }
    const qual = p.kind === 'rubis' ? null : { name: qualityName(p.q), color: qualityColor(p.q) };
    if (p.kind === 'rubis') {
      const r = RUBIS_CATALOG.find(x => x.id === p.id),
        f = RUBIS_FAMILIES[r.family];
      return {
        name: r.name,
        icon: r.icon,
        color: f.light,
        sub: 'Rune · ' + f.short,
        desc: r.desc,
        quality: null
      };
    }
    if (p.kind === 'fish') {
      const f = CANAAN_PROF.FISH[p.id];
      return {
        name: f.name,
        icon: f.icon,
        color: qual.color,
        sub: 'Poisson · ' + qual.name,
        desc: 'À cuisiner près d’une cuisinière (panneau P).',
        quality: qual
      };
    }
    if (p.kind === 'meat') {
      const m = CANAAN_PROF.MEAT[p.id];
      return {
        name: m.name,
        icon: m.icon,
        color: qual.color,
        sub: 'Viande · ' + qual.name,
        desc: 'À cuisiner près d’une cuisinière (panneau P).',
        quality: qual
      };
    }
    if (p.kind === 'ore') {
      const o = CANAAN_GATHER.ORES[p.id];
      const desc = o.rare
        ? 'Minerai rare des Tréfonds : il se vend ' + o.value + ' fois plus cher qu’un minerai de l’île.'
        : 'Pour l’enchanteur : 3 minerais de ' + o.metal + ' donnent un enchantement (panneau P).';
      return {
        name: o.name,
        icon: o.icon,
        color: qual.color,
        sub: 'Minerai · ' + qual.name,
        desc,
        quality: qual
      };
    }
    if (p.kind === 'herb') {
      const h = CANAAN_GATHER.HERBS[p.id];
      return {
        name: h.name,
        icon: h.icon,
        color: qual.color,
        sub: 'Herbe · ' + qual.name,
        desc: 'À cuisiner en infusion près d’une cuisinière (panneau P).',
        quality: qual
      };
    }
    if (p.kind === 'ench') {
      const e = CANAAN_GATHER.ENCHANTS[p.id],
        metal = CANAAN_GATHER.ORES[CANAAN_GATHER.METALS[p.q]].metal,
        color = ['#d07a3a', '#b8c4c8', '#8a6a5a', '#e8eef4', '#f0c040', '#7ae8f0'][p.q];
      return {
        name: e.name,
        icon: e.icon,
        color,
        sub: 'Enchantement · ' + metal,
        desc:
          'Ajoute ' +
          SECONDARY_STATS[p.id].name +
          ' en troisième statistique secondaire (' +
          Math.round(CANAAN_GATHER.ENCH_MULT[p.q] * 100) +
          ' % de la base de l’objet). Clic : choisir la pièce à enchanter.',
        quality: null
      };
    }
    const r = CANAAN_PROF.RECIPES[p.id];
    return {
      name: r.name,
      icon: '⟦prof_cooking⟧',
      color: qual.color,
      sub: 'Repas · ' + qual.name,
      desc: CANAAN_PROF.effect(p.id, p.q, game.hero).text + '. Clic : manger.',
      quality: qual
    };
  }
  // Minerais rares des Tréfonds : leur prix est multiplié (value).
  const unitPrice = p =>
    UNIT_PRICE[p.kind](p.q) *
    (p.kind === 'ore'
      ? CANAAN_GATHER.ORES[p.id]?.value || 1
      : p.kind === 'treasure'
        ? PROF_TREASURES[p.id]?.value || 1
        : p.kind === 'dust'
          ? PROF_DUSTS[p.id]?.value || 1
          : 1);
  const price = p => unitPrice(p) * p.n;
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Case d'une pile : icône, bordure de sa qualité (ou famille), quantité en bas à droite.
  function cell(p, attrs = '') {
    const it = info(p);
    return (
      '<button type="button" class="bag-cell stack-cell" style="border-color:' +
      it.color +
      ';--rarity:' +
      it.color +
      '" data-tooltip-stack="' +
      esc(token(p)) +
      '" ' +
      attrs +
      '>' +
      '<span class="bag-icon">' +
      it.icon +
      '</span><span class="bag-name">' +
      esc(it.name) +
      '</span>' +
      (p.n > 1 ? '<span class="bag-ilvl stack-count">' + p.n + '</span>' : '') +
      '</button>'
    );
  }
  function tooltip(text) {
    const p = parse(text);
    if (!p) return '';
    const it = info(p),
      merchant = typeof nearMerchant === 'function' && nearMerchant();
    return (
      '<div class="tooltip-name skill-tip-head" style="color:' +
      it.color +
      '"><span class="skill-tip-icon">' +
      CANAAN_ICONS.html(it.icon) +
      '</span>' +
      esc(it.name) +
      '</div>' +
      '<div class="tooltip-sub">' +
      esc(it.sub) +
      ' · ×' +
      p.n +
      '</div>' +
      '<div class="skill-tip-desc">' +
      esc(it.desc) +
      '</div>' +
      '<div class="skill-tip-meta">' +
      (sellable(p)
        ? 'Vente : ' +
          unitPrice(p) +
          ' or l’unité' +
          (merchant ? ' · clic droit ou bouton pièce chez le marchand' : '')
        : 'Ne se vend pas.') +
      '</div>'
    );
  }
  function showTooltip(text, event) {
    const p = parse(text);
    // Un Rubis garde son info-bulle complète (effet, famille).
    if (p?.kind === 'rubis') return showRubisTooltip(p.id, event);
    const html = tooltip(text);
    if (!html) return;
    gearTooltip.innerHTML = html;
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  // Utiliser une pile depuis le sac : équiper un Rubis, manger un repas.
  function use(text) {
    const p = parse(text);
    if (!p) return false;
    hideGearTooltip();
    if (p.kind === 'rubis') return equipRubis(p.id);
    if (p.kind === 'meal') return CANAAN_PROF.actions.eat(p.id, p.q);
    if (p.kind === 'ench') return CANAAN_GATHER.actions.use(text);
    if (p.kind === 'key')
      return (toast('🗝️ Approche-toi d’un coffre secret et appuie sur E pour l’ouvrir avec une clé.'), false);
    if (p.kind === 'treasure') return (toast(info(p).name + ' : à vendre chez un marchand.'), false);
    if (p.kind === 'dust') return (CANAAN_PROF.open('enchant'), false);
    toast(info(p).name + ' : à cuisiner près d’une cuisinière (panneau P).');
    return false;
  }

  window.CANAAN_BAG = Object.freeze({
    STACK,
    stackOf,
    bound,
    sellable,
    MAT_LIMIT,
    isMat,
    categoryOf,
    sortGear,
    matUsed,
    count,
    piles,
    tiles,
    used,
    free,
    room,
    add,
    remove,
    token,
    parse,
    isToken,
    info,
    unitPrice,
    price,
    cell,
    tooltip,
    showTooltip,
    use
  });
  Object.assign(window, { canaanBagUsed: used });
})();
