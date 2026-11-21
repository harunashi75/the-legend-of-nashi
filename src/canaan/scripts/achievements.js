// Succès (touche Y) : cent succès en cinq catégories, avec leur récompense (or, expérience, équipement,
// repas, titres), et le bestiaire (onglet des Collections, touche V) : monstres du monde, créatures des donjons,
// boss mondiaux, boss de donjon et de raid, boss de l'Arène, chacun découvert (vu de près) puis vaincu.
// Chaque héros a son carnet (hero.succes : { done, s, sets, best, title }), sauvegardé avec lui. L'hôte décide :
// il compte les exploits de tout le groupe (événements du jeu et relevé chaque seconde), donne les récompenses et
// envoie à chaque invité son carnet dans son message privé ; l'invité choisit son titre (action ach-title).
(() => {
  'use strict';
  const esc = text => safeGearText(text);
  const guest = () => game.mode === 'guest';
  const SET_KEYS = ['biomes', 'visited', 'cleared', 'recipes', 'classes'];
  const fresh = () => ({ done: {}, s: {}, sets: {}, best: {}, title: '' });
  const stateOf = hero => (hero.succes ||= fresh());
  const num = v => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
  const S = key => h => num(stateOf(h).s[key]);
  const SET = key => h => (stateOf(h).sets[key] || []).length;
  const add = (st, key, n = 1) => (st.s[key] = num(st.s[key]) + n);
  const addSet = (st, key, v) => {
    const list = (st.sets[key] ||= []);
    if (!list.includes(v)) list.push(v);
  };
  const lvl = h => clampLevel(h.level);
  const profOf = h => CANAAN_PROF.profOf(h);
  const codex = h => profOf(h).codex || {};
  const ARMOR = ['helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring', 'ring2', 'weapon'];
  const worn = h => ARMOR.map(slot => h.equipment?.[slot]).filter(Boolean);
  const allItems = h =>
    [...(h.inventory || []), ...Object.values(h.equipment || {}), ...((h.bank && h.bank.items) || [])].filter(
      Boolean
    );
  const rank = it => GEAR_RARITIES.findIndex(r => r.name === rarityInfo(it).name);
  const killed = (h, key) => (stateOf(h).best[key]?.[1] || 0) > 0;
  // Artéfacts de l'Arène : nombre possédés, nombre au rang maximum.
  const artefactRanks = h => Object.values(h.artefacts?.ranks || {}).map(artefactRank);
  const artefactCount = h => artefactRanks(h).filter(r => r > 0).length;
  const artefactsAtMax = h => artefactRanks(h).filter(r => r >= ARTEFACT_MAX_RANK).length;
  const talentsFull = cls => h =>
    h.classe?.id === cls && (h.classe.talents || []).length >= TALENT_SLOT_LEVELS.length ? 1 : 0;
  const weaponKills = h =>
    Object.keys(WEAPON_DEFINITIONS).filter(t => num(stateOf(h).s['w_' + t]) >= 50).length;

  // ---------------------------------------------------------------- Bestiaire
  let beasts = null;
  function catalog() {
    if (beasts) return beasts;
    const out = [],
      seen = new Set(),
      push = b => {
        if (seen.has(b.key)) return;
        seen.add(b.key);
        out.push(b);
      };
    // Seules les espèces qui apparaissent vraiment : celles d'une région de l'île, et toutes celles des Tréfonds.
    const roaming = new Set(ZONES.flatMap(z => z.mobs || []));
    for (const t of canaanMobTypes().filter(t => t.under !== undefined || roaming.has(t.name)))
      push({
        key: 'm:' + t.name,
        group: t.under === undefined ? 'mob' : 'under',
        name: t.name,
        where:
          (t.under === undefined ? 'Monde ouvert' : 'Tréfonds · ' + CANAAN_UNDER.BIOMES[t.under].name) +
          ' · élite : ' +
          t.elite,
        look: { t: t.name, mobColor: t.color }
      });
    instances.forEach((d, i) =>
      CANAAN_DUNGEON_MOBS(i).forEach(m =>
        push({
          key: 'd:' + m.name,
          group: 'dungeon',
          name: m.name,
          where: d.name,
          look: { t: m.name, look: m.look, pal: m.pal, lookOpts: m }
        })
      )
    );
    // Boss mondiaux de l'île, extensions présentes comprises.
    for (const b of WORLD_BOSSES)
      push({
        key: 'w:' + b.id,
        group: 'world',
        name: b.name,
        where: 'Boss mondial · niveau ' + b.level,
        look: { t: b.name, worldBoss: true, worldBossId: b.id, mobColor: b.color }
      });
    for (const b of CANAAN_UNDER.BOSSES)
      push({
        key: 'w:' + b.id,
        group: 'world',
        name: b.name,
        where: 'Boss des Tréfonds · à ton niveau',
        look: { t: b.name, look: b.look, pal: b.pal, lookOpts: b.opts }
      });
    instances.forEach((d, i) =>
      (d.bosses || [d.boss]).forEach((name, k) => {
        const looks = CANAAN_DUNGEON_BOSS_LOOKS(i),
          look = looks[k] || looks[0] || {};
        push({
          key: 'b:' + name,
          group: 'boss',
          name,
          where: (d.raid ? 'Raid · ' : 'Donjon · ') + d.name,
          look: { t: name, look: look.look, pal: look.pal, lookOpts: look, boss: true, mobColor: d.color }
        });
      })
    );
    // Boss cachés, derrière les passages secrets des donjons et des raids.
    instances.forEach((d, i) =>
      (d.secrets || []).forEach((name, k) => {
        const look = CANAAN_DUNGEON_SECRET_LOOKS(i)[k] || {};
        push({
          key: 'b:' + name,
          group: 'boss',
          name,
          where: 'Boss caché · ' + d.name,
          look: { t: name, look: look.look, pal: look.pal, lookOpts: look, boss: true, mobColor: d.color }
        });
      })
    );
    ARENA_BOSSES.forEach((b, k) =>
      push({
        key: 'a:' + b.name,
        group: 'arena',
        name: b.name,
        where: 'Arène des Épreuves · vague ' + (k + 1),
        look: { t: b.name, look: b.look, pal: b.pal, lookOpts: b.opts || {} }
      })
    );
    beasts = out;
    return out;
  }
  const beastKeys = () => new Set(catalog().map(b => b.key));
  // Repère d'un monstre dans le bestiaire (les clones de l'Arène et les inconnus ne comptent pas).
  function beastKey(m) {
    if (!m || m.arenaClone) return null;
    const key = m.arenaBoss
      ? 'a:' + m.t
      : m.worldBoss
        ? 'w:' + m.worldBossId
        : m.boss
          ? 'b:' + m.t
          : 'm:' + m.t;
    if (beastKeys().has(key)) return key;
    return beastKeys().has('d:' + m.t) ? 'd:' + m.t : null;
  }
  const bestiary = h =>
    catalog().filter(b => b.group === 'mob' || b.group === 'dungeon' || b.group === 'under');

  // ---------------------------------------------------------------- Catalogue des succès
  // Récompenses : gold (or), exp (part d'un niveau d'XP), gear (qualité, au niveau du héros),
  // stack ([genre, id, qualité, nombre] dans le sac), title (titre affichable), aura (aura dorée).
  const CATS = [
    { id: 'combat', icon: '⚔️', name: 'Combat & armes' },
    { id: 'explore', icon: '🗺️', name: 'Exploration & aventure' },
    { id: 'eco', icon: '💰', name: 'Économie & métiers' },
    { id: 'magic', icon: '🔮', name: 'Magie, artéfacts & progression' },
    { id: 'defi', icon: '🏆', name: 'Défis & Arène' }
  ];
  const A = (cat, id, icon, name, desc, goal, val, reward = {}, pts = 10) => ({
    cat,
    id,
    icon,
    name,
    desc,
    goal,
    val,
    reward,
    pts
  });
  const W = (id, type, name, reward) =>
    A(
      'combat',
      id,
      WEAPON_TYPES[type].icon,
      name,
      'Vaincre 200 ennemis avec une arme de la famille ' + WEAPON_TYPES[type].name + '.',
      200,
      S('w_' + type),
      reward,
      15
    );
  const LIST = [
    // ---------------------------------------------------------------- Combat & armes
    A(
      'combat',
      'c1',
      '🩸',
      'Premiers pas ensanglantés',
      'Vaincre ton tout premier monstre.',
      1,
      h => Math.max(S('kills')(h), h.kills || 0),
      { gold: 50 },
      5
    ),
    A(
      'combat',
      'c2',
      '⚔️',
      'Le massacre des Plaines',
      'Vaincre 100 monstres.',
      100,
      h => Math.max(S('kills')(h), h.kills || 0),
      { gold: 300, stack: ['meal', 'soupe', 1, 5] }
    ),
    A(
      'combat',
      'c3',
      '🗡️',
      'Fléau des ténèbres',
      'Vaincre 1 000 monstres.',
      1000,
      h => Math.max(S('kills')(h), h.kills || 0),
      { title: 'Le Pourfendeur', gold: 1000 },
      25
    ),
    A(
      'combat',
      'c4',
      '💀',
      'Génocide légendaire',
      'Vaincre 10 000 monstres.',
      10000,
      h => Math.max(S('kills')(h), h.kills || 0),
      { title: 'Dieu de la guerre', gold: 10000 },
      50
    ),
    A('combat', 'c5', '⭐', 'Chasseur d’élites', 'Vaincre 25 monstres élites.', 25, S('elites'), {
      gear: 'Rare'
    }),
    A(
      'combat',
      'c6',
      '🌟',
      'Fléau des élites',
      'Vaincre 250 monstres élites.',
      250,
      S('elites'),
      { gear: 'Épique', title: 'Briseur d’élites' },
      25
    ),
    A('combat', 'c7', '🎯', 'Œil du tigre', 'Réussir 500 coups critiques.', 500, S('crits'), { gold: 800 }),
    A(
      'combat',
      'c8',
      '💥',
      'Frappe dévastatrice',
      'Infliger 1 000 dégâts en un seul coup.',
      1000,
      S('maxHit'),
      { gold: 500 }
    ),
    A(
      'combat',
      'c9',
      '💥',
      'Le Dévastateur',
      'Infliger 5 000 dégâts en un seul coup.',
      5000,
      S('maxHit'),
      { title: 'Le Dévastateur' },
      25
    ),
    A('combat', 'c10', '🏃', 'Artiste de l’esquive', 'Faire 500 roulades d’esquive.', 500, S('dodges'), {
      title: 'L’Insaisissable',
      gear: 'Rare'
    }),
    A('combat', 'c11', '🌀', 'Tempête d’acier', 'Lancer 1 000 compétences d’arme.', 1000, S('skills'), {
      exp: 0.5
    }),
    A(
      'combat',
      'c12',
      '✨',
      'Pouvoir de classe',
      'Lancer 100 fois le sort de ta classe (touche F).',
      100,
      S('specials'),
      { exp: 0.5 }
    ),
    A(
      'combat',
      'c13',
      '⚔️',
      'Maître d’armes',
      'Vaincre 50 ennemis avec chacune des neuf familles d’arme.',
      9,
      weaponKills,
      { title: 'Maître d’armes', gear: 'Épique' },
      50
    ),
    W('c14', 'bow', 'Tireur d’élite', { gear: 'Rare' }),
    W('c15', 'dualdagger', 'Exécuteur silencieux', { gear: 'Rare' }),
    W('c16', 'axe', 'Bûcheron des âmes', { gear: 'Rare' }),
    W('c17', 'mace', 'Masse atomique', { gear: 'Rare' }),
    W('c18', 'staff', 'Surcharge arcanique', { gear: 'Rare' }),
    A(
      'combat',
      'c19',
      '⟦artefact_couronne_souverain⟧',
      'Résilience du Souverain',
      'Survivre à un coup fatal grâce à la Couronne du Souverain.',
      1,
      S('phoenix'),
      { gold: 500 }
    ),
    A(
      'combat',
      'c20',
      '🩸',
      'Bourreau des cœurs',
      'Vaincre un boss mondial moins de 30 secondes après le premier coup.',
      1,
      S('fastWb'),
      { gear: 'Épique' },
      25
    ),
    // ---------------------------------------------------------------- Exploration & aventure
    A(
      'explore',
      'e1',
      '🌅',
      'Le grand départ',
      'Quitter le Camp de l’Aurore pour la première fois.',
      1,
      S('leftCamp'),
      { gold: 50 },
      5
    ),
    A(
      'explore',
      'e2',
      '🥾',
      'Promeneur solitaire',
      'Marcher 10 km dans le monde ouvert (une case = 1 m).',
      10000,
      S('dist'),
      { gold: 500 }
    ),
    A(
      'explore',
      'e3',
      '🥾',
      'Globe-trotteur',
      'Marcher 50 km dans le monde ouvert.',
      50000,
      S('dist'),
      { title: 'Le Vagabond' },
      25
    ),
    A('explore', 'e4', '🌍', 'Touriste des biomes', 'Visiter les six régions de l’île.', 6, SET('biomes'), {
      title: 'Voyageur intrépide',
      gold: 600
    }),
    A(
      'explore',
      'e5',
      '🎁',
      'Chasseur de trésors',
      'Ouvrir ton premier coffre secret.',
      1,
      h => Math.max(S('chests')(h), h === game.hero ? game.world.openedChests.length : 0),
      { gold: 200 },
      5
    ),
    A(
      'explore',
      'e6',
      '🎁',
      'Pilleur de tombes',
      'Ouvrir 25 coffres secrets.',
      25,
      h => Math.max(S('chests')(h), h === game.hero ? game.world.openedChests.length : 0),
      { gear: 'Rare' }
    ),
    A(
      'explore',
      'e7',
      '🧭',
      'Cartographe royal',
      'Ouvrir tous les coffres secrets de l’île.',
      () => hiddenChestSpots.length,
      h => Math.max(S('chests')(h), h === game.hero ? game.world.openedChests.length : 0),
      { title: 'Cartographe royal', gear: 'Épique' },
      50
    ),
    A(
      'explore',
      'e8',
      '🏛️',
      'Premier portail',
      'Entrer dans un donjon ou un raid.',
      1,
      SET('visited'),
      { gold: 100 },
      5
    ),
    A(
      'explore',
      'e9',
      '🌌',
      'Collectionneur de portails',
      'Entrer dans tous les donjons et raids, sur l’île et dans les Tréfonds.',
      () => instances.length,
      SET('visited'),
      { gold: 2000 },
      25
    ),
    A(
      'explore',
      'e10',
      '🌋',
      'Promenade en enfer',
      'Entrer dans la Forge d’Écaille-Ardente.',
      1,
      h => ((stateOf(h).sets.visited || []).includes(4) ? 1 : 0),
      { gold: 400 }
    ),
    A(
      'explore',
      'e11',
      '🌌',
      'Pèlerinage céleste',
      'Atteindre l’Aiguille du Continuum.',
      1,
      h => ((stateOf(h).sets.visited || []).includes(7) ? 1 : 0),
      { gold: 800 }
    ),
    A(
      'explore',
      'e12',
      '💀',
      'Au cœur des ténèbres',
      'Rester 5 minutes d’affilée dans une région plus forte que toi, sans tomber.',
      300,
      S('highZone'),
      { gear: 'Rare' }
    ),
    A(
      'explore',
      'e13',
      '❓',
      'Touriste égaré',
      'Tomber dans la Forêt enchantée (niveau 50+) en étant niveau 10 ou moins.',
      1,
      S('reckless'),
      { title: 'Téméraire inconscient' },
      15
    ),
    A(
      'explore',
      'e14',
      '💫',
      'Première chute',
      'Tomber au combat pour la première fois.',
      1,
      S('deaths'),
      { gold: 50 },
      5
    ),
    A(
      'explore',
      'e15',
      '☠️',
      'Increvable',
      'Tomber 100 fois et te relever à chaque fois.',
      100,
      S('deaths'),
      { title: 'L’Increvable' },
      15
    ),
    A(
      'explore',
      'e16',
      '🐉',
      'Chasseur de légendes',
      'Découvrir les huit boss mondiaux.',
      8,
      h => WORLD_BOSS_DEFS.filter(b => stateOf(h).best['w:' + b.id]?.[0]).length,
      { gold: 1500 },
      15
    ),
    A(
      'explore',
      'e17',
      '📜',
      'Premier chapitre',
      'Terminer une quête.',
      1,
      h => Object.keys(h.quetes?.done || {}).length,
      { gold: 100 },
      5
    ),
    A(
      'explore',
      'e18',
      '📖',
      'Aventurier aguerri',
      'Terminer 15 quêtes.',
      15,
      h => Object.keys(h.quetes?.done || {}).length,
      { gear: 'Rare' }
    ),
    A(
      'explore',
      'e19',
      '📚',
      'Chroniqueur de l’Aurore',
      'Terminer toutes les quêtes.',
      () => QUESTS.length,
      h => Object.keys(h.quetes?.done || {}).length,
      { title: 'Chroniqueur', gear: 'Épique' },
      25
    ),
    A(
      'explore',
      'e20',
      '👑',
      'Légende vivante',
      'Terminer l’histoire « Les Échos de l’Aurore ».',
      1,
      h => (h.quetes?.flags?.title ? 1 : 0),
      { title: 'Sauveur de Canaan', gold: 3000 },
      50
    ),
    // ---------------------------------------------------------------- Économie & métiers
    A(
      'eco',
      'p1',
      '🪙',
      'Premier pécule',
      'Gagner tes 100 premières pièces d’or.',
      100,
      S('goldEarned'),
      { gold: 50 },
      5
    ),
    A(
      'eco',
      'p2',
      '💰',
      'Magnat de l’or',
      'Gagner 100 000 pièces d’or au total.',
      100000,
      S('goldEarned'),
      { title: 'Le Magnat' },
      25
    ),
    A(
      'eco',
      'p3',
      '🎒',
      'Gros portefeuille',
      'Agrandir ton sac jusqu’à 100 places.',
      100,
      h => canaanBagLimit(h),
      { gold: 2000 }
    ),
    A(
      'eco',
      'p4',
      '⭐',
      'Maître artisan',
      'Atteindre le niveau 40 dans un métier.',
      40,
      h =>
        Math.max(
          ...['fishing', 'cooking', 'hunting', 'mining', 'herbalism', 'enchanting'].map(
            k => profOf(h)[k]?.level || 1
          )
        ),
      { title: 'Maître artisan' },
      25
    ),
    A(
      'eco',
      'p5',
      '⚖️',
      'Commerçant malin',
      'Gagner 10 000 pièces d’or en vendant aux marchands.',
      10000,
      S('sold'),
      { title: 'Le Marchand' },
      15
    ),
    A('eco', 'p6', '🏦', 'Coffre-fort', 'Ranger 50 cases à la banque.', 50, h => CANAAN_BANK.used(h), {
      gold: 500
    }),
    A('eco', 'p7', '⟦prof_mining⟧', 'Mineur de fond', 'Extraire 100 minerais.', 100, S('ores'), {
      stack: ['ore', 'fer', 2, 10]
    }),
    A('eco', 'p8', '⟦ore_or⟧', 'Chercheur d’or pur', 'Extraire une pépite d’or.', 1, S('oreOr'), {
      gold: 400
    }),
    A('eco', 'p9', '⟦prof_herbalism⟧', 'Herboriste des bois', 'Cueillir 100 herbes.', 100, S('herbs'), {
      stack: ['herb', 'sauge', 2, 10]
    }),
    A('eco', 'p10', '⟦herb_lys⟧', 'La main verte', 'Cueillir un aloès ou un lys étoilé.', 1, S('herbRare'), {
      gold: 400
    }),
    A(
      'eco',
      'p11',
      '⟦prof_cooking⟧',
      'Apprenti cuisinier',
      'Cuisiner 10 recettes différentes.',
      10,
      SET('recipes'),
      { gold: 400 }
    ),
    A(
      'eco',
      'p12',
      '⟦prof_cooking⟧',
      'Maître cuisinier',
      'Cuisiner toutes les recettes du jeu.',
      () => Object.keys(CANAAN_PROF.RECIPES).length,
      SET('recipes'),
      { title: 'Chef étoilé' },
      25
    ),
    A(
      'eco',
      'p13',
      '🍳',
      'Festin royal',
      'Cuisiner un repas de qualité Mythique.',
      1,
      S('mealMythic'),
      { gear: 'Épique' },
      25
    ),
    A(
      'eco',
      'p14',
      '🎣',
      'Pêcheur du dimanche',
      'Pêcher ton tout premier poisson.',
      1,
      h =>
        Math.max(
          S('fish')(h),
          Object.keys(CANAAN_PROF.FISH).reduce((n, k) => n + (codex(h)[k]?.n || 0), 0)
        ),
      { gold: 50 },
      5
    ),
    A(
      'eco',
      'p15',
      '⟦fish_espadon⟧',
      'Gros poisson',
      'Pêcher un espadon ou un poisson-lune astral.',
      1,
      h => (codex(h).espadon || codex(h).lune ? 1 : 0),
      { gold: 600 }
    ),
    A(
      'eco',
      'p16',
      '⟦fish_lune⟧',
      'Maître des profondeurs',
      'Compléter la collection des poissons.',
      () => Object.keys(CANAAN_PROF.FISH).length,
      h => Object.keys(CANAAN_PROF.FISH).filter(k => codex(h)[k]).length,
      { title: 'Vieux Loup de Mer', gear: 'Épique' },
      25
    ),
    A(
      'eco',
      'p17',
      '⟦prof_enchanting⟧',
      'Enchanteur débutant',
      'Avoir une pièce d’équipement enchantée.',
      1,
      h => (allItems(h).some(it => it.ench) ? 1 : 0),
      { gold: 200 },
      5
    ),
    A(
      'eco',
      'p18',
      '⟦prof_enchanting⟧',
      'Runes mystiques',
      'Porter huit pièces enchantées.',
      8,
      h => worn(h).filter(it => it.ench).length,
      { title: 'Le Runiste', gear: 'Épique' },
      25
    ),
    A(
      'eco',
      'p19',
      '⟦prof_hunting⟧',
      'Chasseur de viande',
      'Chasser 50 animaux.',
      50,
      h =>
        Math.max(
          S('hunts')(h),
          Object.keys(CANAAN_PROF.GAME).reduce((n, k) => n + (codex(h)[k]?.n || 0), 0)
        ),
      { stack: ['meal', 'roti', 2, 5] }
    ),
    A('eco', 'p20', '🤝', 'Le Philanthrope', 'Faire un échange avec un autre joueur.', 1, S('trades'), {
      title: 'Le Philanthrope'
    }),
    // ---------------------------------------------------------------- Magie, artéfacts & progression
    A('magic', 'm1', '⭐', 'Éveil des pouvoirs', 'Atteindre le niveau 10.', 10, lvl, { gold: 300 }, 5),
    A('magic', 'm2', '⭐', 'Force de l’âge', 'Atteindre le niveau 30.', 30, lvl, {
      gear: 'Rare',
      gold: 1000
    }),
    A(
      'magic',
      'm3',
      '🌟',
      'Transcendance totale',
      'Atteindre le niveau maximum (60).',
      60,
      lvl,
      { title: 'L’Immortel', gear: 'Épique' },
      50
    ),
    A(
      'magic',
      'm4',
      '🔮',
      'Premier artéfact',
      'Équiper ton premier artéfact de l’Arène.',
      1,
      h => (h.artefacts?.equipped || []).filter(Boolean).length,
      { gold: 100 },
      5
    ),
    A(
      'magic',
      'm5',
      '🔮',
      'Collectionneur d’artéfacts',
      'Posséder 6 artéfacts différents.',
      6,
      artefactCount,
      { gold: 1500 },
      15
    ),
    A(
      'magic',
      'm6',
      '🔮',
      'Maître des artéfacts',
      'Posséder les 12 artéfacts de l’Arène.',
      () => ARTEFACTS.length,
      artefactCount,
      { title: 'Le Maître des artéfacts' },
      50
    ),
    A(
      'magic',
      'm7',
      '◆',
      'Artéfact parfait',
      'Faire monter un artéfact au rang 5.',
      1,
      h => artefactsAtMax(h),
      { gold: 800 }
    ),
    A(
      'magic',
      'm8',
      '🔮',
      'Quatre reliques',
      'Remplir tes quatre emplacements d’artéfacts.',
      ARTEFACT_SLOTS,
      h => (h.artefacts?.equipped || []).filter(Boolean).length,
      { gold: 800 }
    ),
    A(
      'magic',
      'm9',
      '◆',
      'Arsenal du Souverain',
      'Faire monter quatre artéfacts au rang 5.',
      4,
      h => artefactsAtMax(h),
      { gold: 800 }
    ),
    A(
      'magic',
      'm10',
      '⟦artefact_couronne_souverain⟧',
      'Immortalité du Souverain',
      'Être sauvé par la Couronne du Souverain en plein combat de boss.',
      1,
      S('phoenixBoss'),
      { gold: 1500 },
      25
    ),
    A(
      'magic',
      'm11',
      '⟦menu_talents⟧',
      'Spécialisation de classe',
      'Choisir ta classe.',
      1,
      h => (h.classe?.id ? 1 : 0),
      { gold: 100 },
      5
    ),
    A(
      'magic',
      'm12',
      '⟦cls_druide⟧',
      'Maître Druide',
      'Remplir les cinq emplacements de talents en Druide.',
      1,
      talentsFull('druide'),
      { gear: 'Épique' },
      15
    ),
    A(
      'magic',
      'm13',
      '⟦cls_paladin⟧',
      'Paladin éternel',
      'Remplir les cinq emplacements de talents en Paladin.',
      1,
      talentsFull('paladin'),
      { gear: 'Épique' },
      15
    ),
    A(
      'magic',
      'm14',
      '⟦cls_assassin⟧',
      'Ombre mortelle',
      'Remplir les cinq emplacements de talents en Assassin.',
      1,
      talentsFull('assassin'),
      { gear: 'Épique' },
      15
    ),
    A(
      'magic',
      'm15',
      '⟦cls_elementaliste⟧',
      'Seigneur des Éléments',
      'Remplir les cinq emplacements de talents en Élémentaliste.',
      1,
      talentsFull('elementaliste'),
      { gear: 'Épique' },
      15
    ),
    A(
      'magic',
      'm16',
      '⟦menu_talents⟧',
      'Toutes les voies',
      'Jouer les quatre classes.',
      4,
      SET('classes'),
      { title: 'L’Éclectique' },
      15
    ),
    A(
      'magic',
      'm17',
      '🌟',
      'Éclat légendaire',
      'Obtenir un objet Légendaire.',
      1,
      h => (allItems(h).some(it => rank(it) >= 4) ? 1 : 0),
      { gold: 2000 },
      25
    ),
    A(
      'magic',
      'm18',
      '🌟',
      'Mythe vivant',
      'Obtenir un objet Mythique.',
      1,
      h => (allItems(h).some(it => rank(it) >= 5) ? 1 : 0),
      { title: 'Porteur de mythe' },
      50
    ),
    A(
      'magic',
      'm19',
      '🛡️',
      'Panoplie épique',
      'Porter huit pièces Épiques ou mieux.',
      8,
      h => worn(h).filter(it => rank(it) >= 3).length,
      { gold: 3000 },
      25
    ),
    A(
      'magic',
      'm20',
      '👑',
      'Collectionneur mythique',
      'Porter huit pièces Mythiques.',
      8,
      h => worn(h).filter(it => rank(it) >= 5).length,
      { title: 'Élu des Dieux' },
      50
    ),
    // ---------------------------------------------------------------- Défis & Arène
    A(
      'defi',
      'd1',
      '⚔️',
      'Entrée dans l’Arène',
      'Tenter l’Arène des Épreuves.',
      1,
      h => h.arena?.attempts || 0,
      { gold: 100 },
      5
    ),
    A('defi', 'd2', '🛡️', 'Gladiateur', 'Atteindre la vague 6 de l’Arène.', 6, h => h.arena?.best || 0, {
      gear: 'Rare'
    }),
    A(
      'defi',
      'd3',
      '🏆',
      'Champion des champions',
      'Vaincre les 12 vagues de l’Arène.',
      1,
      h => (h.arena?.completed ? 1 : 0),
      { title: 'Champion de l’Arène' },
      50
    ),
    A(
      'defi',
      'd4',
      '⟦mode_heroic⟧',
      'Le triomphe de l’Héroïque',
      'Terminer le Jugement de Célestia en mode Héroïque.',
      1,
      S('raid4h'),
      { title: 'Dominateur des Mondes' },
      50
    ),
    A(
      'defi',
      'd5',
      '⚖️',
      'Chasseur de divinités',
      'Vaincre L’Avatar du Jugement.',
      1,
      h => (killed(h, 'b:L’Avatar du Jugement') ? 1 : 0),
      { gear: 'Épique' },
      25
    ),
    A(
      'defi',
      'd6',
      '🐉',
      'Premier boss mondial',
      'Vaincre un boss mondial.',
      1,
      h => WORLD_BOSS_DEFS.filter(b => killed(h, 'w:' + b.id)).length,
      { gold: 500 }
    ),
    A(
      'defi',
      'd7',
      '🐉',
      'Tueur de dieux anciens',
      'Vaincre les huit boss mondiaux.',
      8,
      h => WORLD_BOSS_DEFS.filter(b => killed(h, 'w:' + b.id)).length,
      { title: 'Titanomache', gear: 'Épique' },
      50
    ),
    A(
      'defi',
      'd8',
      '🔥',
      'Le réveil du dragon',
      'Vaincre Pyrrhax, Wyrm d’Écaille-Ardente.',
      1,
      h => (killed(h, 'b:Pyrrhax, Wyrm d’Écaille-Ardente') ? 1 : 0),
      { gold: 1000 }
    ),
    A(
      'defi',
      'd9',
      '👑',
      'Cauchemar d’argent',
      'Vaincre le Roi Sanglant dans le Bastion.',
      1,
      h => (killed(h, 'b:Le Roi Sanglant') ? 1 : 0),
      { gold: 1500 }
    ),
    A(
      'defi',
      'd10',
      '🌌',
      'Voyageur temporel',
      'Vaincre le Dévoreur Stellaire dans l’Aiguille du Continuum.',
      1,
      h => (killed(h, 'b:Le Dévoreur Stellaire') ? 1 : 0),
      { gold: 2000 }
    ),
    A(
      'defi',
      'd11',
      '⚖️',
      'Jugement dernier',
      'Vaincre L’Avatar du Jugement moins de 3 minutes après le premier coup.',
      1,
      S('fastAvatar'),
      { gear: 'Épique' },
      50
    ),
    A(
      'defi',
      'd12',
      '🗡️',
      'Défi en solitaire',
      'Terminer un donjon ou un raid seul, sans tomber.',
      1,
      S('solo'),
      { title: 'Loup solitaire' },
      25
    ),
    A(
      'defi',
      'd13',
      '🩸',
      'Le prix du sang',
      'Vaincre un boss en ayant moins de 5 % de tes PV.',
      1,
      S('lowBoss'),
      { gold: 1500 },
      25
    ),
    A(
      'defi',
      'd14',
      '⚡',
      'Vitesse éclair',
      'Terminer un donjon ou un raid en moins de 5 minutes.',
      1,
      S('fastClear'),
      { gear: 'Rare' }
    ),
    A(
      'defi',
      'd15',
      '🏰',
      'Conquérant des donjons',
      'Terminer les six donjons de l’île.',
      6,
      h =>
        (stateOf(h).sets.cleared || []).filter(i => instances[i] && !instances[i].raid && !instances[i].under)
          .length,
      { gear: 'Épique' },
      25
    ),
    A(
      'defi',
      'd16',
      '🏰',
      'Fléau des raids',
      'Terminer les quatre raids.',
      4,
      h => (stateOf(h).sets.cleared || []).filter(i => instances[i]?.raid).length,
      { title: 'Fléau des raids' },
      50
    ),
    A(
      'defi',
      'd17',
      '🛡️',
      'Résistant suprême',
      'Subir 1 000 000 de dégâts au total.',
      1000000,
      S('hurt'),
      { title: 'Le Roc' },
      25
    ),
    A(
      'defi',
      'd18',
      '📖',
      'Bestiaire complet',
      'Vaincre chaque espèce du monde, des donjons et des raids.',
      () => bestiary().length,
      h => bestiary().filter(b => killed(h, b.key)).length,
      { title: 'Le Naturaliste' },
      50
    ),
    A(
      'defi',
      'd19',
      '🌟',
      'Perfectionniste absolu',
      'Débloquer 99 succès.',
      98,
      h => Object.keys(stateOf(h).done).filter(id => id !== 'd19' && id !== 'd20').length,
      { gold: 10000 },
      50
    ),
    A(
      'defi',
      'd20',
      '👑',
      'La Légende de Nashi',
      'Débloquer tous les autres succès.',
      99,
      h => Object.keys(stateOf(h).done).filter(id => id !== 'd20').length,
      { title: 'La Légende Vivante', aura: true },
      100
    )
  ];
  const BY_ID = Object.fromEntries(LIST.map(a => [a.id, a]));
  const goalOf = a => (typeof a.goal === 'function' ? a.goal() : a.goal);
  const progress = (h, a) => {
    try {
      return Math.min(goalOf(a), Math.floor(num(a.val(h))));
    } catch {
      return 0;
    }
  };
  const points = h => Object.keys(stateOf(h).done).reduce((n, id) => n + (BY_ID[id]?.pts || 0), 0);
  const TITLES = LIST.filter(a => a.reward.title);
  function titleOf(hero) {
    if (!hero) return '';
    if (guest() && hero !== game.hero) return hero.achTitle || '';
    const st = stateOf(hero),
      a = BY_ID[st.title];
    return a && a.reward.title && st.done[a.id] ? a.reward.title : '';
  }
  const auraOf = hero => (guest() && hero !== game.hero ? !!hero.achAura : !!stateOf(hero).done.d20);

  // ---------------------------------------------------------------- Récompenses
  function rewardText(r) {
    const out = [];
    if (r.title) out.push('Titre « ' + r.title + ' »');
    if (r.aura) out.push('aura dorée');
    if (r.gear) out.push('un objet ' + r.gear + ' de ton niveau');
    if (r.stack)
      out.push(
        r.stack[3] +
          ' × ' +
          CANAAN_BAG.info({ kind: r.stack[0], id: r.stack[1], q: r.stack[2], n: r.stack[3] }).name
      );
    if (r.exp) out.push(Math.round(r.exp * 100) + ' % d’un niveau d’XP');
    if (r.gold) out.push(r.gold + ' or');
    return out.join(' · ');
  }
  function grant(hero, a) {
    const r = a.reward,
      p = hero.player;
    if (r.gold) p.gold += r.gold;
    if (r.exp) canaanGrantXp(hero, Math.round(xpToNext(lvl(hero)) * r.exp));
    // Objet de récompense : de ton niveau (pas celui de l'instance), annoncé comme récompense de succès.
    if (r.gear) {
      const item = giveGear(lvl(hero), 'normal', r.gear, hero);
      if (item) {
        item.origin = 'succès';
        canaanLootNotice(
          hero,
          '🏆 Récompense du succès « ' +
            a.name +
            ' » : objet ' +
            r.gear +
            ' de ton niveau (' +
            lvl(hero) +
            ').'
        );
      }
    }
    if (r.stack) {
      const [kind, id, q, n] = r.stack;
      if (CANAAN_BAG.room(hero, kind, id, q, n)) CANAAN_BAG.add(hero, kind, id, q, n);
      else p.gold += CANAAN_BAG.price({ kind, id, q, n });
    }
    hero.netBag = null;
  }

  // ---------------------------------------------------------------- Hôte : événements du jeu
  const BOSSY = m => m.boss || m.worldBoss || m.arenaBoss;
  // Héros qui partagent une victoire sur un boss : tous ceux de l'instance, ou ceux qui sont tout près dehors.
  const sharers = (m, killer) =>
    game.world.instance
      ? game.heroes.filter(h => !h.away)
      : game.heroes.filter(
          h => h === killer || (!h.away && Math.hypot(h.player.x - m.x, h.player.y - m.y) < 18 * TS)
        );
  function onKill(hero, m) {
    if (!m || m.arenaClone) return;
    const key = beastKey(m),
      list = BOSSY(m) ? sharers(m, hero) : [hero];
    for (const h of list) {
      const st = stateOf(h);
      if (key) {
        const b = (st.best[key] ||= [1, 0, 0]);
        b[0] = 1;
        b[1]++;
        if (m.elite) b[2]++;
      }
      if (h !== hero && !BOSSY(m)) continue;
      add(st, 'kills');
      if (m.elite) add(st, 'elites');
      const p = h.player;
      if (BOSSY(m) && !p.dead && p.hp / Math.max(1, p.mhp) < 0.05) st.s.lowBoss = 1;
      const secs = Number.isFinite(m._achHit) ? (time - m._achHit) / 60 : Infinity;
      if (m.worldBoss && secs < 30) st.s.fastWb = 1;
      if (m.boss && m.t === 'L’Avatar du Jugement' && secs < 180) st.s.fastAvatar = 1;
    }
    const type = hero.equipment?.weapon?.weaponType;
    if (type && Object.hasOwn(WEAPON_DEFINITIONS, type)) add(stateOf(hero), 'w_' + type);
  }
  function onClear(hero, index) {
    const st = stateOf(hero),
      inst = game.world.instance;
    addSet(st, 'cleared', index);
    if (!inst) return;
    if (index === 9 && inst.difficulty === 'heroic') st.s.raid4h = 1;
    if ((inst.group || 1) === 1 && !hero._achRunDied) st.s.solo = 1;
    if (Number.isFinite(inst._achStart) && (time - inst._achStart) / 60 < 300) st.s.fastClear = 1;
  }
  // Point d'entrée des événements (hôte ou partie solo ; un invité ne compte rien lui-même).
  function event(hero, type, a, b, c) {
    if (guest() || !hero || !hero.player) return;
    const st = stateOf(hero);
    switch (type) {
      case 'kill':
        return onKill(hero, a);
      case 'hit':
        if (a && !Number.isFinite(a._achHit)) a._achHit = time;
        st.s.maxHit = Math.max(num(st.s.maxHit), Math.round(num(b)));
        if (c) add(st, 'crits');
        return;
      case 'hurt':
        return add(st, 'hurt', num(a));
      case 'dodge':
        return add(st, 'dodges');
      case 'skill':
        return add(st, 'skills');
      case 'special':
        return add(st, 'specials');
      case 'fish':
        return add(st, 'fish');
      case 'hunt':
        return add(st, 'hunts');
      case 'gather':
        if (a === 'ore') add(st, 'ores', num(c) || 1);
        else add(st, 'herbs', num(c) || 1);
        if (a === 'ore' && b === 'or') st.s.oreOr = 1;
        if (a === 'herb' && (b === 'aloes' || b === 'lys')) st.s.herbRare = 1;
        return;
      case 'cook':
        addSet(st, 'recipes', a);
        if (b >= 5) st.s.mealMythic = 1;
        return;
      case 'chest':
        return add(st, 'chests');
      case 'clear':
        return onClear(hero, a);
      case 'phoenix':
        add(st, 'phoenix');
        if (
          game.world.monsters.some(
            m => BOSSY(m) && m.hp > 0 && Math.hypot(m.x - hero.player.x, m.y - hero.player.y) < 700
          )
        )
          st.s.phoenixBoss = 1;
        return;
      case 'trade':
        return add(st, 'trades');
      case 'sell':
        return add(st, 'sold', num(a));
    }
  }

  // ---------------------------------------------------------------- Hôte : relevé chaque seconde et déblocage
  function sample(hero) {
    const st = stateOf(hero),
      p = hero.player,
      inst = game.world.instance;
    // Or gagné : toutes les hausses de la bourse.
    if (Number.isFinite(hero._achGold) && p.gold > hero._achGold)
      add(st, 'goldEarned', p.gold - hero._achGold);
    hero._achGold = p.gold;
    // Distance à pied dans le monde ouvert (une case = 1 m ; les téléportations ne comptent pas).
    if (!inst && !hero.away && hero._achPos) {
      const d = Math.hypot(p.x - hero._achPos.x, p.y - hero._achPos.y);
      if (d < 20 * TS) add(st, 'dist', d / TS);
    }
    hero._achPos = { x: p.x, y: p.y };
    if (hero.classe?.id) addSet(st, 'classes', hero.classe.id);
    // Tombé : compté une fois par chute.
    if (p.dead && !hero._achDead) {
      add(st, 'deaths');
      hero._achRunDied = true;
      hero._achHigh = 0;
      if (
        !inst &&
        game.world.layer !== 'under' &&
        canaanZoneIndexAt(p.x / TS, p.y / TS) === 5 &&
        lvl(hero) <= 10
      )
        st.s.reckless = 1;
    }
    hero._achDead = !!p.dead;
    if (inst) {
      if (hero._achInst !== inst) {
        hero._achInst = inst;
        hero._achRunDied = !!p.dead;
      }
      if (!Number.isFinite(inst._achStart)) inst._achStart = time;
      if (!inst.arena && Number.isInteger(inst.index)) addSet(st, 'visited', inst.index);
    } else if (!hero.away && game.world.layer !== 'under') {
      const zone = canaanZoneIndexAt(p.x / TS, p.y / TS);
      if (zone >= 0 && zone < 6) addSet(st, 'biomes', zone);
      if (Math.hypot(p.x / TS - CANAAN_CAMP.x, p.y / TS - CANAAN_CAMP.y) > CANAAN_CAMP.r + 14)
        st.s.leftCamp = 1;
      // Région plus forte que le héros : temps passé d'affilée, sans tomber.
      if (!p.dead && ZONE_LEVELS[zone] && ZONE_LEVELS[zone][0] > lvl(hero)) {
        hero._achHigh = (hero._achHigh || 0) + 1;
        st.s.highZone = Math.max(num(st.s.highZone), hero._achHigh);
      } else hero._achHigh = 0;
    }
    // Découvertes : les créatures vues de près.
    if (!hero.away)
      for (const m of game.world.monsters) {
        if (m.hp <= 0 || Math.hypot(m.x - p.x, m.y - p.y) > 340) continue;
        const key = beastKey(m);
        if (key) (st.best[key] ||= [1, 0, 0])[0] = 1;
      }
  }
  function evaluate(hero) {
    const st = stateOf(hero),
      unlocked = [];
    for (let pass = 0; pass < 2; pass++)
      for (const a of LIST) {
        if (st.done[a.id] || progress(hero, a) < goalOf(a)) continue;
        st.done[a.id] = Date.now();
        grant(hero, a);
        unlocked.push(a);
      }
    if (!unlocked.length) return unlocked;
    hero.netAch = null;
    window.CANAAN_PERSISTENCE.requestSave();
    announce(hero, unlocked);
    if (hero === game.hero) steamSync();
    return unlocked;
  }
  function announce(hero, list) {
    if (hero === game.hero) popup(list);
    else for (const a of list.slice(0, 3)) canaanLootNotice(hero, '🏆 Succès : ' + a.name);
    if (game.heroes.length > 1)
      for (const a of list.slice(0, 3))
        chat('Succès', (hero.name || 'Le héros') + ' débloque « ' + a.name + ' »');
  }
  // Succès Steam (application de bureau lancée par Steam) : les succès du héros joué sur cet appareil (l'hôte, ou
  // l'invité avec le carnet reçu de l'hôte) sont reportés sur le compte Steam du joueur ; anciens succès compris.
  let steamSent = -1;
  function steamSync() {
    const steam = window.canaanDesktop?.steam;
    if (!steam || !started) return;
    const done = Object.keys(stateOf(game.hero).done).filter(id => BY_ID[id]);
    if (done.length === steamSent) return;
    steamSent = done.length;
    steam.unlock(done);
  }
  setInterval(steamSync, 5000);
  let clock = 0;
  function tick() {
    if (!started || guest() || paused) return;
    if (++clock % 60) return;
    for (const hero of game.heroes) {
      sample(hero);
      evaluate(hero);
    }
  }

  // ---------------------------------------------------------------- Bandeau de déblocage
  const banner = document.createElement('div');
  banner.id = 'achPopup';
  banner.setAttribute('role', 'status');
  document.body.appendChild(banner);
  const queue = [];
  let showing = false;
  function popup(list) {
    if (!list.length) return;
    // Beaucoup d'un coup (ancienne aventure) : un seul bandeau récapitulatif.
    if (list.length > 3)
      queue.push({
        icon: '🏆',
        name: list.length + ' succès débloqués !',
        sub: 'Ouvre le panneau des succès (Y) pour les voir.'
      });
    else for (const a of list) queue.push({ icon: a.icon, name: a.name, sub: rewardText(a.reward) });
    if (!showing) next();
  }
  function next() {
    const item = queue.shift();
    if (!item) {
      showing = false;
      banner.classList.remove('show');
      return;
    }
    showing = true;
    banner.innerHTML =
      '<span class="ach-pop-icon">' +
      item.icon +
      '</span><span><small>Succès débloqué</small><b>' +
      esc(item.name) +
      '</b><em>' +
      esc(item.sub) +
      '</em></span>';
    banner.classList.add('show');
    CANAAN_SOUND.cue('levelup');
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(next, 400);
    }, 4200);
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  function sanitize(raw) {
    const out = fresh();
    if (!raw || typeof raw !== 'object') return out;
    if (raw.done && typeof raw.done === 'object')
      for (const [id, t] of Object.entries(raw.done))
        if (BY_ID[id]) out.done[id] = Number.isFinite(Number(t)) ? Number(t) : 1;
    if (raw.s && typeof raw.s === 'object')
      for (const [k, v] of Object.entries(raw.s))
        if (/^[a-zA-Z_]{1,24}$/.test(k) && Number.isFinite(Number(v)) && Number(v) > 0)
          out.s[k] = Math.min(1e12, Math.round(Number(v) * 10) / 10);
    if (raw.sets && typeof raw.sets === 'object')
      for (const k of SET_KEYS)
        if (Array.isArray(raw.sets[k]))
          out.sets[k] = [
            ...new Set(
              raw.sets[k].filter(v => (typeof v === 'string' && v.length <= 40) || Number.isInteger(v))
            )
          ].slice(0, 100);
    if (raw.best && typeof raw.best === 'object') {
      const keys = beastKeys();
      for (const [k, v] of Object.entries(raw.best))
        if (keys.has(k) && Array.isArray(v))
          out.best[k] = [v[0] ? 1 : 0, Math.floor(num(v[1])), Math.floor(num(v[2]))];
    }
    if (typeof raw.title === 'string' && BY_ID[raw.title]?.reward.title && out.done[raw.title])
      out.title = raw.title;
    return out;
  }
  const exportOf = hero => sanitize(stateOf(hero));
  // Carnet envoyé à un invité : à chaque déblocage, sinon toutes les trois secondes s'il a changé.
  function netView(hero) {
    const text = JSON.stringify(stateOf(hero));
    if (text === hero.netAch || (hero.netAch && time - (hero.netAchAt || 0) < 180)) return undefined;
    hero.netAch = text;
    hero.netAchAt = time;
    return JSON.parse(text);
  }
  function applyRemote(v) {
    const before = game.hero.succes,
      next = sanitize(v);
    game.hero.succes = next;
    if (before && before._remote) popup(LIST.filter(a => next.done[a.id] && !before.done[a.id]));
    steamSync();
    next._remote = true;
    render();
    refreshTitles();
  }
  function setTitle(hero, id) {
    const st = stateOf(hero);
    if (id !== '' && !(BY_ID[id]?.reward.title && st.done[id])) return false;
    st.title = id;
    hero.netAch = null;
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'ach-title') return setTitle(hero, action.id === 'none' ? '' : action.id);
    return false;
  }

  // ---------------------------------------------------------------- Titres et aura en jeu
  function draw(c) {
    for (const hero of game.heroes) {
      const p = hero.player;
      if (hero.away || Math.abs(p.x - P.x) > W || Math.abs(p.y - P.y) > H) continue;
      const title = titleOf(hero),
        self = hero === game.hero;
      if (auraOf(hero)) {
        c.save();
        c.globalAlpha = 0.35 + Math.sin(time * 0.07) * 0.15;
        c.strokeStyle = '#ffd86a';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(p.x, p.y + 17, 22, 8, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = '#fff2b0';
        for (let k = 0; k < 4; k++) {
          const a = time * 0.04 + (k * Math.PI) / 2;
          c.fillRect(
            p.x + Math.cos(a) * 22 - 1.5,
            p.y + 17 + Math.sin(a) * 8 - 1.5 - ((time + k * 20) % 40) * 0.6,
            3,
            3
          );
        }
        c.restore();
      }
      if (!title) continue;
      c.save();
      c.textAlign = 'center';
      c.font = 'italic bold 11px Palatino Linotype, Georgia, serif';
      c.lineWidth = 3;
      c.strokeStyle = '#120c07';
      c.fillStyle = auraOf(hero) ? '#ffe27a' : '#e8c878';
      const y = p.y - (self ? 52 : 66),
        text = '« ' + title + ' »';
      c.strokeText(text, p.x, y);
      c.fillText(text, p.x, y);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- Panneau (touche Y)
  const ui = { cat: 'all' };
  const portraits = new Map();
  function portrait(b) {
    if (portraits.has(b.key)) return portraits.get(b.key);
    let url = '';
    try {
      const cv = canaanActorPortrait({ ...b.look, x: 0, y: 0 });
      url = cv && cv.toDataURL ? cv.toDataURL() : '';
    } catch {
      url = '';
    }
    portraits.set(b.key, url);
    return url;
  }
  const date = t => (t > 1e9 ? new Date(t).toLocaleDateString('fr-FR') : '');
  function card(h, a) {
    const st = stateOf(h),
      done = !!st.done[a.id],
      goal = goalOf(a),
      have = done ? goal : progress(h, a),
      pct = Math.round((100 * have) / Math.max(1, goal)),
      big = n => Math.floor(n).toLocaleString('fr-FR');
    return (
      '<article class="ach-card' +
      (done ? ' done' : '') +
      '"><span class="ach-icon">' +
      a.icon +
      '</span><div class="ach-body">' +
      '<h4>' +
      esc(a.name) +
      ' <small>' +
      a.pts +
      ' pts</small></h4><p>' +
      esc(a.desc) +
      '</p>' +
      (goal > 1
        ? '<div class="ach-bar"><i style="width:' +
          pct +
          '%"></i><span>' +
          big(have) +
          ' / ' +
          big(goal) +
          '</span></div>'
        : '') +
      '<p class="ach-reward">⟦menu_achievements⟧ ' +
      esc(rewardText(a.reward)) +
      '</p></div>' +
      (done ? '<span class="ach-date">✓ ' + date(st.done[a.id]) + '</span>' : '') +
      '</article>'
    );
  }
  function tabSucces(h) {
    const st = stateOf(h),
      count = cat => LIST.filter(a => (cat === 'all' || a.cat === cat) && st.done[a.id]).length,
      chips = [
        { id: 'all', icon: '🏆', name: 'Tous' },
        ...CATS,
        { id: 'recent', icon: '⭐', name: 'Récents' }
      ];
    let list =
      ui.cat === 'all'
        ? LIST
        : ui.cat === 'recent'
          ? LIST.filter(a => st.done[a.id])
              .sort((x, y) => st.done[y.id] - st.done[x.id])
              .slice(0, 12)
          : LIST.filter(a => a.cat === ui.cat);
    // Les succès presque finis d'abord, puis les autres ; les débloqués à la fin (sauf dans « Récents »).
    if (ui.cat !== 'recent')
      list = [...list].sort(
        (x, y) => !!st.done[x.id] - !!st.done[y.id] || progress(h, y) / goalOf(y) - progress(h, x) / goalOf(x)
      );
    return (
      '<div class="ach-chips">' +
      chips
        .map(c => {
          const total =
            c.id === 'all' ? LIST.length : c.id === 'recent' ? 0 : LIST.filter(a => a.cat === c.id).length;
          return (
            '<button type="button" class="' +
            (ui.cat === c.id ? 'on' : '') +
            '" data-action="achCat" data-cat="' +
            c.id +
            '">' +
            c.icon +
            ' ' +
            esc(c.name) +
            (total ? ' <small>' + count(c.id) + '/' + total + '</small>' : '') +
            '</button>'
          );
        })
        .join('') +
      '</div><div class="ach-list">' +
      (list.length
        ? list.map(a => card(h, a)).join('')
        : '<p class="muted">Aucun succès débloqué pour l’instant.</p>') +
      '</div>'
    );
  }
  const GROUPS = [
    ['mob', '⚔️ Monstres du monde'],
    ['under', '🏮 Créatures des Tréfonds'],
    ['dungeon', '🏛️ Créatures des donjons et raids'],
    ['world', '🐉 Boss mondiaux'],
    ['boss', '🏰 Boss de donjon et de raid'],
    ['arena', '🏆 Boss de l’Arène']
  ];
  function tabBestiaire(h) {
    const st = stateOf(h),
      all = catalog(),
      seen = all.filter(b => st.best[b.key]?.[0]).length,
      won = all.filter(b => killed(h, b.key)).length;
    return (
      '<p class="ach-summary">Découverts <b>' +
      seen +
      ' / ' +
      all.length +
      '</b> · Vaincus <b>' +
      won +
      ' / ' +
      all.length +
      '</b> <span class="muted">— une créature est découverte quand tu la croises de près.</span></p>' +
      GROUPS.map(([g, label]) => {
        const list = all.filter(b => b.group === g),
          n = list.filter(b => st.best[b.key]?.[0]).length;
        return (
          '<h3 class="ach-group">' +
          label +
          ' <small>' +
          n +
          ' / ' +
          list.length +
          '</small></h3><div class="beast-grid">' +
          list
            .map(b => {
              const rec = st.best[b.key],
                known = !!rec?.[0],
                img = portrait(b),
                won = rec?.[1] || 0;
              return (
                '<div class="beast-card' +
                (won ? ' killed' : known ? ' seen' : ' unknown') +
                '" title="' +
                (known ? esc(b.name + ' — ' + b.where) : 'Créature inconnue') +
                '">' +
                (img
                  ? '<img class="beast-img" alt="" src="' + img + '">'
                  : '<span class="beast-img">❓</span>') +
                '<b>' +
                (known ? esc(b.name) : '???') +
                '</b><small>' +
                (known ? esc(b.where) : 'Pas encore croisée') +
                '</small>' +
                '<span class="beast-kills">' +
                (won
                  ? '⚔️ ' +
                    won.toLocaleString('fr-FR') +
                    (rec[2] ? ' · ⭐ ' + rec[2] + ' élite' + (rec[2] > 1 ? 's' : '') : '')
                  : known
                    ? 'Découverte'
                    : '') +
                '</span></div>'
              );
            })
            .join('') +
          '</div>'
        );
      }).join('')
    );
  }
  // Onglet Titres de la fiche (C) : choisir le titre affiché au-dessus du héros, parmi ceux des succès débloqués.
  const titlesCount = h => TITLES.filter(a => stateOf(h).done[a.id]).length + ' / ' + TITLES.length;
  // La fiche ouverte sur cet onglet est redessinée (titre choisi, ou carnet reçu de l'hôte).
  function refreshTitles() {
    if (window.canaanCharacterTab() === 'titles') refreshGearPanel();
  }
  function tabTitres(h) {
    const st = stateOf(h),
      mine = TITLES.filter(a => st.done[a.id]);
    return (
      '<p class="muted">Ton titre s’affiche au-dessus de ton personnage, pour tous les joueurs du groupe.</p><div class="ach-titles">' +
      '<button type="button" class="' +
      (!st.title ? 'on' : '') +
      '" data-action="achTitle" data-title="none">Aucun titre</button>' +
      mine
        .map(
          a =>
            '<button type="button" class="' +
            (st.title === a.id ? 'on' : '') +
            '" data-action="achTitle" data-title="' +
            a.id +
            '">« ' +
            esc(a.reward.title) +
            ' »<small>' +
            esc(a.name) +
            '</small></button>'
        )
        .join('') +
      '</div>' +
      (TITLES.length > mine.length
        ? '<h3 class="ach-group">À débloquer</h3><div class="ach-titles locked">' +
          TITLES.filter(a => !st.done[a.id])
            .map(a => '<span>🔒 « ' + esc(a.reward.title) + ' »<small>' + esc(a.name) + '</small></span>')
            .join('') +
          '</div>'
        : '')
    );
  }
  const isOpen = () => modalOpen() && !!document.querySelector('#window .ach-panel');
  let shown = '';
  const signature = () =>
    JSON.stringify([stateOf(game.hero).done, stateOf(game.hero).title, ui, stateOf(game.hero).s]);
  function render() {
    if (!isOpen()) return;
    shown = signature();
    const h = game.hero,
      st = stateOf(h),
      done = Object.keys(st.done).length;
    const scroll = document.querySelector('#window .ach-scroll')?.scrollTop || 0;
    showPanel(
      canaanHead('⟦menu_achievements⟧ Succès') +
        '<div class="rpg-paper ach-panel panel-fill" data-panel-size="md">' +
        '<div class="ach-top"><div class="ach-total"><b>' +
        done +
        ' / ' +
        LIST.length +
        '</b> succès · <b>' +
        points(h) +
        '</b> points</div><div class="ach-bar big"><i style="width:' +
        Math.round((100 * done) / LIST.length) +
        '%"></i></div></div>' +
        '<div class="ach-scroll panel-scroll">' +
        tabSucces(h) +
        '</div></div>'
    );
    const box = document.querySelector('#window .ach-scroll');
    if (box) box.scrollTop = scroll;
  }
  function toggle() {
    if (!started || paused) return;
    if (modalOpen()) {
      const mine = isOpen();
      closePanels();
      if (mine) return;
    }
    hideGearTooltip();
    showPanel('<div class="rpg-paper ach-panel"></div>');
    render();
  }
  setInterval(() => {
    if (started && isOpen() && signature() !== shown) render();
  }, 500);
  const actions = {
    cat(id) {
      if (id !== 'all' && id !== 'recent' && !CATS.some(c => c.id === id)) return false;
      ui.cat = id;
      const box = document.querySelector('#window .ach-scroll');
      render();
      if (box) document.querySelector('#window .ach-scroll').scrollTop = 0;
      return true;
    },
    title(id) {
      if (guest()) return CANAAN_NET.requestAction({ op: 'ach-title', id });
      const ok = setTitle(game.hero, id === 'none' ? '' : id);
      refreshTitles();
      return ok;
    }
  };

  window.CanaanStages.achievements = { after: tick };
  window.CANAAN_ACHIEVEMENTS = Object.freeze({
    LIST,
    CATS,
    catalog,
    beastKey,
    event,
    sample,
    evaluate,
    progress,
    points,
    rewardText,
    titleOf,
    sanitize,
    export: exportOf,
    netView,
    applyRemote,
    handle,
    setTitle,
    draw,
    render,
    toggle,
    isOpen,
    actions,
    // Onglet Bestiaire des Collections (V) : son contenu et son compteur.
    bestiary: tabBestiaire,
    titles: tabTitres,
    titlesCount,
    bestiaryCount: h => catalog().filter(b => stateOf(h).best[b.key]?.[0]).length + ' / ' + catalog().length,
    steamSync
  });
  Object.assign(window, { canaanAchieve: event, toggleAchievements: toggle });
})();
