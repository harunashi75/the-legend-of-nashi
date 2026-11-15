// Récolte et enchantement : trois métiers de plus, à côté de la pêche, de la chasse et de la cuisine (panneau P).
// - Minage : des filons de minerai sur toute l'île, un minerai par biome (du cuivre des Plaines au mithril de la
//   Forêt enchantée). Touche E près d'un filon.
// - Cueillette : des herbes sauvages dans chaque biome (cuisinées en infusions, voir professions.js).
// - Enchanteur : 3 minerais d'un même métal donnent un enchantement ; chaque enchantement porte une statistique
//   secondaire (Puissance, Critique, Célérité, Maîtrise, Soin, Résistance). Posé sur un équipement, il lui ajoute
//   cette statistique en troisième secondaire ; sa force dépend du métal et du niveau de l'objet.
// Minerais, herbes et enchantements sont des objets du sac (piles de 100), rangés dans hero.prof.ore / herb / ench.
// Un gisement récolté se reforme au bout de 90 s pour ce héros (chacun récolte les siens). L'hôte décide ; un invité
// demande (actions gather, enchant-craft, enchant-apply) et reçoit ses gisements épuisés avec sa pêche en cours.
(() => {
  'use strict';
  // Un métal par biome (ordre des ZONES) ; son rang donne la force de l'enchantement.
  const ORES = Object.freeze({
    cuivre: { name: 'Minerai de cuivre', metal: 'cuivre', tier: 0, zone: 0, color: '#d07a3a', icon: '⟦ore_cuivre⟧' },
    etain: { name: 'Minerai d’étain', metal: 'étain', tier: 1, zone: 1, color: '#b8c4c8', icon: '⟦ore_etain⟧' },
    fer: { name: 'Minerai de fer', metal: 'fer', tier: 2, zone: 2, color: '#8a6a5a', icon: '⟦ore_fer⟧' },
    argent: { name: 'Minerai d’argent', metal: 'argent', tier: 3, zone: 3, color: '#e8eef4', icon: '⟦ore_argent⟧' },
    or: { name: 'Pépite d’or', metal: 'or', tier: 4, zone: 4, color: '#f0c040', icon: '⟦ore_or⟧' },
    mithril: { name: 'Minerai de mithril', metal: 'mithril', tier: 5, zone: 5, color: '#7ae8f0', icon: '⟦ore_mithril⟧' },
    // Minerais rares des Tréfonds (zones 6 à 9) : ils ne font pas d'enchantement, mais se vendent très cher (value).
    fer_noir: { name: 'Minerai de fer noir', metal: 'fer noir', tier: 3, zone: 6, color: '#5a5e6e', icon: '⟦ore_fer_noir⟧', value: 3, rare: true },
    quartz: { name: 'Quartz ancien', metal: 'quartz', tier: 3, zone: 7, color: '#e8e0f8', icon: '⟦ore_quartz⟧', value: 3, rare: true },
    obsidienne: { name: 'Obsidienne funèbre', metal: 'obsidienne', tier: 4, zone: 8, color: '#3a2a4a', icon: '⟦ore_obsidienne⟧', value: 4, rare: true },
    geode: { name: 'Géode luisante', metal: 'géode', tier: 4, zone: 9, color: '#e870c0', icon: '⟦ore_geode⟧', value: 5, rare: true }
  });
  const HERBS = Object.freeze({
    menthe: { name: 'Menthe sauvage', zone: 0, color: '#7ad87a', icon: '⟦herb_menthe⟧', where: 'Plaines verdoyantes' },
    sauge: { name: 'Sauge des bois', zone: 1, color: '#9ab8a0', icon: '⟦herb_sauge⟧', where: 'Forêt ancienne' },
    mousse: { name: 'Mousse des brumes', zone: 2, color: '#6ab0a0', icon: '⟦herb_mousse⟧', where: 'Marais brumeux' },
    ortie: { name: 'Ortie rousse', zone: 3, color: '#d8803a', icon: '⟦herb_ortie⟧', where: 'Forêt automnale' },
    aloes: { name: 'Aloès des sables', zone: 4, color: '#a8c860', icon: '⟦herb_aloes⟧', where: 'Désert oublié' },
    lys: { name: 'Lys étoilé', zone: 5, color: '#c8a8ff', icon: '⟦herb_lys⟧', where: 'Forêt enchantée' },
    // Herbes des Tréfonds.
    racine: { name: 'Racine de pierre', zone: 6, color: '#a87a4a', icon: '⟦herb_racine⟧', where: 'Galeries d’Argile (Tréfonds)' },
    lichen: { name: 'Lichen des ruines', zone: 7, color: '#8ac8b0', icon: '⟦herb_lichen⟧', where: 'Cité Engloutie (Tréfonds)' },
    pavot: { name: 'Pavot funèbre', zone: 8, color: '#a8f0c0', icon: '⟦herb_pavot⟧', where: 'Nécropole des Oubliés (Tréfonds)' },
    champignon: { name: 'Champignon luisant', zone: 9, color: '#e870c0', icon: '⟦herb_champignon⟧', where: 'Fangeval (Tréfonds)' }
  });
  // Enchantements : une statistique secondaire chacun.
  const ENCHANTS = Object.freeze({
    power: { name: 'Enchantement de Puissance', icon: '⟦ench_power⟧' },
    crit: { name: 'Enchantement de Critique', icon: '⟦ench_crit⟧' },
    haste: { name: 'Enchantement de Célérité', icon: '⟦ench_haste⟧' },
    mastery: { name: 'Enchantement de Maîtrise', icon: '⟦ench_mastery⟧' },
    healing: { name: 'Enchantement de Soin', icon: '⟦ench_healing⟧' },
    resist: { name: 'Enchantement de Résistance', icon: '⟦ench_resist⟧' }
  });
  // Métaux d'enchantement, rang 0 à 5 (les minerais des Tréfonds n'en sont pas).
  const METALS = ['cuivre', 'etain', 'fer', 'argent', 'or', 'mithril'];
  // Force d'un enchantement selon le métal (part de la base de l'objet, comme une secondaire : 16 % à 40 %) et
  // niveau d'enchanteur requis pour le forger. Le niveau d'enchanteur de celui qui pose l'enchantement le renforce
  // aussi de 1 % par niveau (jusqu'à +40 %).
  const ENCH_MULT = [0.16, 0.2, 0.24, 0.28, 0.33, 0.4];
  const ENCH_LEVEL = [1, 5, 10, 15, 20, 25];
  const levelTooLow = (hero, tier) => CANAAN_PROF.profOf(hero).enchanting.level < ENCH_LEVEL[tier];
  const levelText = (hero, tier) => 'Enchanteur niveau ' + ENCH_LEVEL[tier] + ' requis pour le ' + ORES[METALS[tier]].metal + ' (tu es niveau ' + CANAAN_PROF.profOf(hero).enchanting.level + ').';
  const levelBonus = hero => 1 + 0.01 * (CANAAN_PROF.profOf(hero).enchanting.level || 1);
  const ORES_PER_ENCHANT = 3;
  const RESPAWN = 90 * 60;
  const REACH = TS * 1.7;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tell = (hero, text) => canaanLootNotice(hero, text);
  const guest = () => game.mode === 'guest';

  // ---------------------------------------------------------------- Gisements (mêmes positions chez chacun)
  let nodes = null;
  const tile = (tx, ty) => game.world.overworld?.[ty]?.[tx];
  function findNodes() {
    nodes = [];
    const hash = (x, y, k) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + k * 57.3) * 43758.5453;
      return n - Math.floor(n);
    };
    const ores = Object.entries(ORES),
      herbs = Object.entries(HERBS);
    for (let ty = 5; ty < MAPH - 5; ty += 3)
      for (let tx = 5; tx < MAPW - 5; tx += 3) {
        const t = tile(tx, ty),
          x = (tx + 0.5) * TS,
          y = (ty + 0.5) * TS;
        // Sur la terre ferme, hors des routes, du camp, des bâtiments et des lieux de quête.
        if (t === undefined || t === 2 || SOLID.includes(t) || [15, 18].includes(t) || !canWalk(x, y) || isSafe(tx, ty) || canaanRoomAt(tx, ty)) continue;
        if (canaanQuestWalk(tx, ty) !== null || BRIDGE_TILES.has(ty * MAPW + tx)) continue;
        if (game.world.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 4 * TS)) continue;
        const zone = Math.max(0, ZONES.indexOf(regionAt(tx, ty))),
          roll = hash(tx, ty, 1);
        // Filons près des rochers (plus rares), herbes un peu partout.
        const rocky = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tile(tx + dx, ty + dy) === 4);
        let kind = null;
        if (roll < (rocky ? 0.2 : 0.035)) kind = 'ore';
        else if (roll > 0.968) kind = 'herb';
        if (!kind || nodes.some(n => Math.hypot(n.tx - tx, n.ty - ty) < (kind === 'ore' ? 7 : 5))) continue;
        const [id] = (kind === 'ore' ? ores : herbs).find(([, d]) => d.zone === zone);
        nodes.push({ tx, ty, x, y, kind, id, zone });
      }
    // Puis ceux des Tréfonds (même liste, mêmes numéros chez chacun), marqués layer: 'under'.
    nodes.push(...CANAAN_UNDER.nodes());
    return nodes;
  }
  const allNodes = () => nodes || findNodes();
  // Gisements épuisés d'un héros (hôte) ou reçus de l'hôte (invité).
  const cdOf = hero => (hero.gatherCd ||= {});
  function depleted(hero) {
    const cd = cdOf(hero),
      out = [];
    for (const [i, until] of Object.entries(cd)) {
      if (until > time) out.push(Number(i));
      else delete cd[i];
    }
    return out;
  }
  const myDepleted = () => new Set(guest() ? CANAAN_PROF.myLive().gather || [] : depleted(game.hero));
  function nodeNear(x, y) {
    if (game.world.instance) return -1;
    let best = -1,
      bd = REACH;
    allNodes().forEach((n, i) => {
      if (!canaanHere(n)) return;
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }

  // ---------------------------------------------------------------- Hôte : récolte
  function gather(hero, index) {
    const n = allNodes()[index],
      p = hero?.player;
    if (!n || !p || p.dead || hero.away || game.world.instance || !canaanHere(n)) return false;
    if (Math.hypot(n.x - p.x, n.y - p.y) > REACH + TS * 0.5) return false;
    if ((cdOf(hero)[index] || 0) > time) return tell(hero, n.kind === 'ore' ? '⛏️ Ce filon est épuisé : il se reforme bientôt.' : '🌿 Déjà cueillie : elle repousse bientôt.'), false;
    const prof = CANAAN_PROF.profOf(hero),
      skill = n.kind === 'ore' ? 'mining' : 'herbalism',
      q = Math.max(0, CANAAN_PROF.capOf(prof[skill].level) - Math.floor(-Math.log(1 - Math.random()) * 1.3)),
      // Un filon donne 1 à 3 minerais, une herbe 1 à 2 brins.
      count = n.kind === 'ore' ? 1 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    if (!CANAAN_BAG.room(hero, n.kind, n.id, q, count)) return tell(hero, '🎒 Sac plein : fais de la place pour récolter.'), false;
    CANAAN_BAG.add(hero, n.kind, n.id, q, count);
    cdOf(hero)[index] = time + RESPAWN;
    const d = n.kind === 'ore' ? ORES[n.id] : HERBS[n.id],
      quality = GEAR_RARITIES[q] || GEAR_RARITIES[0];
    float(n.x, n.y - 40, d.icon + ' ' + d.name + ' ×' + count + ' (' + quality.name + ')', quality.color);
    burst(n.x, n.y - 10, d.color, 10);
    CANAAN_PROF.gainXp(hero, skill, 8 + 5 * q + (n.kind === 'ore' ? 2 * ORES[n.id].tier : 0));
    canaanAchieve(hero, 'gather', n.kind, n.id, count);
    hero.netBag = null;
    return true;
  }

  // ---------------------------------------------------------------- Hôte : enchanteur
  // Fabriquer : 3 minerais d'un métal (les moins bons d'abord) pour un enchantement de la statistique choisie.
  function craft(hero, stat, tier, count = 1) {
    const metal = METALS[tier],
      prof = CANAAN_PROF.profOf(hero);
    if (!ENCHANTS[stat] || !metal) return false;
    if (!nearForge(hero)) return tell(hero, '⚒️ Les enchantements se fabriquent à une forge : celle du Camp de l’Aurore, ou celle de la Forteresse de Durgrim (Tréfonds).'), false;
    if (levelTooLow(hero, tier)) return tell(hero, '✨ ' + levelText(hero, tier)), false;
    let made = 0;
    for (let k = 0; k < Math.max(1, Math.min(20, count | 0)); k++) {
      const have = () => Array.from({ length: 8 }, (_, q) => CANAAN_BAG.count(hero, 'ore', metal, q));
      if (have().reduce((a, b) => a + b, 0) < ORES_PER_ENCHANT) break;
      // Le minerai part avant que l'enchantement prenne sa place dans le sac.
      const spent = [];
      let left = ORES_PER_ENCHANT;
      for (let q = 0; q < 8 && left > 0; q++) {
        const n = Math.min(left, CANAAN_BAG.count(hero, 'ore', metal, q));
        if (n > 0) {
          CANAAN_BAG.remove(hero, 'ore', metal, q, n);
          spent.push([q, n]);
          left -= n;
        }
      }
      if (!CANAAN_BAG.room(hero, 'ench', stat, tier, 1)) {
        for (const [q, n] of spent) CANAAN_BAG.add(hero, 'ore', metal, q, n);
        tell(hero, '🎒 Sac plein : impossible de ranger l’enchantement.');
        break;
      }
      CANAAN_BAG.add(hero, 'ench', stat, tier, 1);
      CANAAN_PROF.gainXp(hero, 'enchanting', 30 + 15 * tier);
      made++;
    }
    if (!made) return tell(hero, '✨ Il faut ' + ORES_PER_ENCHANT + ' ' + ORES[metal].name.toLowerCase() + ' pour cet enchantement.'), false;
    tell(hero, '✨ ' + made + ' × ' + ENCHANTS[stat].name + ' (' + ORES[metal].metal + ') créé' + (made > 1 ? 's' : '') + '.');
    hero.netBag = null;
    return true;
  }
  // Valeur d'un enchantement sur un objet : part de la base de l'objet selon le métal, renforcée par le niveau
  // d'enchanteur de celui qui le pose (hero ; aucun bonus sans héros).
  function value(item, tier, hero = null) {
    return Math.max(1, Math.round(statBase(itemLevel(item), item.rarity) * ENCH_MULT[tier] * (hero ? levelBonus(hero) : 1)));
  }
  // Poser un enchantement (repère d'une pile ench:...) sur un équipement du sac (identifiant) ou porté (emplacement).
  function apply(hero, token, ref) {
    const p = CANAAN_BAG.parse(token);
    if (!p || p.kind !== 'ench' || CANAAN_BAG.count(hero, 'ench', p.id, p.q) < 1) return false;
    const worn = Object.hasOwn(hero.equipment, ref),
      item = worn ? hero.equipment[ref] : hero.inventory.find(it => it && String(it.id) === String(ref));
    if (!item || item.slot === 'artifact') return tell(hero, '✨ Choisis une pièce d’équipement (pas un artefact).'), false;
    CANAAN_BAG.remove(hero, 'ench', p.id, p.q, 1);
    const before = item.ench;
    item.ench = { stat: p.id, value: value(item, p.q, hero), tier: p.q };
    if (worn) {
      if (hero === game.hero) recomputeStats();
      else recomputeHeroStats(hero);
    }
    tell(hero, '✨ ' + gearDisplayName(item) + ' : ' + (before ? 'enchantement remplacé, ' : '') + '+' + item.ench.value + ' ' + SECONDARY_STATS[p.id].name + '.');
    hero.netBag = null;
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // ---------------------------------------------------------------- Travaux minutés (miner, cueillir, forger, cuisiner)
  // Le héros reste sur place le temps du travail, avec son animation ; bouger l'interrompt. À la fin, l'action a lieu
  // (et ses règles sont revérifiées). Un seul travail à la fois.
  const WORK = { mine: 5, herb: 5, forge: 10, cook: 6 };
  const workTime = (kind, count = 1) =>
    (kind === 'forge' ? Math.min(30, WORK.forge + 2 * (count - 1)) : kind === 'cook' ? Math.min(15, WORK.cook + 0.5 * (count - 1)) : WORK[kind]) * 60;
  // Forge du camp, ou celle de la Forteresse naine dans les Tréfonds.
  function forgeSpot() {
    return game.world.layer === 'under' ? CANAAN_UNDER.forgeSpot() : CANAAN_CAMP_LIFE.forge();
  }
  function nearForge(hero) {
    const f = forgeSpot(),
      p = hero.player;
    return !!f && !game.world.instance && Math.hypot(p.x - f.x, p.y - f.y) < TS * 3;
  }
  function startWork(hero, kind, target, finish, count = 1) {
    const p = hero.player;
    if (!p || p.dead || hero.away) return false;
    if (hero.work) return tell(hero, '⏳ Termine d’abord ce que tu fais.'), false;
    hero.work = { kind, start: time, until: time + workTime(kind, count), x: p.x, y: p.y, tx: target.x, ty: target.y, node: target.node ?? -1, finish };
    return true;
  }
  function startGather(hero, index) {
    const n = allNodes()[index],
      p = hero?.player;
    if (!n || !p || p.dead || hero.away || game.world.instance || !canaanHere(n)) return false;
    if (Math.hypot(n.x - p.x, n.y - p.y) > REACH + TS * 0.5) return false;
    if ((cdOf(hero)[index] || 0) > time) return tell(hero, n.kind === 'ore' ? '⛏️ Ce filon est épuisé : il se reforme bientôt.' : '🌿 Déjà cueillie : elle repousse bientôt.'), false;
    if (!CANAAN_BAG.room(hero, n.kind, n.id, 0, 1) && !CANAAN_BAG.piles(hero).some(q => q.kind === n.kind && q.id === n.id && q.n % 100)) return tell(hero, '🎒 Sac plein : fais de la place pour récolter.'), false;
    return startWork(hero, n.kind === 'ore' ? 'mine' : 'herb', { x: n.x, y: n.y, node: index }, () => gather(hero, index));
  }
  function startCraft(hero, stat, tier, count) {
    const metal = METALS[tier],
      prof = CANAAN_PROF.profOf(hero),
      f = forgeSpot();
    if (!ENCHANTS[stat] || !metal) return false;
    if (!nearForge(hero)) return tell(hero, '⚒️ Va à la forge du Camp de l’Aurore pour fabriquer un enchantement.'), false;
    if (levelTooLow(hero, tier)) return tell(hero, '✨ ' + levelText(hero, tier)), false;
    const have = Array.from({ length: 8 }, (_, q) => CANAAN_BAG.count(hero, 'ore', metal, q)).reduce((a, b) => a + b, 0),
      n = Math.max(1, Math.min(20, count | 0, Math.floor(have / ORES_PER_ENCHANT)));
    if (have < ORES_PER_ENCHANT) return tell(hero, '✨ Il faut ' + ORES_PER_ENCHANT + ' ' + ORES[metal].name.toLowerCase() + ' pour cet enchantement.'), false;
    if (!CANAAN_BAG.room(hero, 'ench', stat, tier, n) && canaanBagUsed(hero) >= canaanBagLimit(hero))
      return tell(hero, '🎒 Sac plein : libère une case pour ranger l’enchantement.'), false;
    return startWork(hero, 'forge', { x: f.x + TS * 0.9, y: f.y - TS * 0.4 }, () => craft(hero, stat, tier, n), n);
  }
  // Cuisine (professions.js) : près d'une cuisinière, le temps de préparer le repas.
  function startCook(hero, at, finish, count) {
    return startWork(hero, 'cook', at, finish, count);
  }
  function cancelWork(hero, why) {
    if (!hero.work) return;
    hero.work = null;
    if (why) tell(hero, why);
  }
  // Un pas de simulation : avancement, interruption si le héros bouge, fin du travail.
  function stepWork() {
    for (const hero of game.heroes) {
      const w = hero.work,
        p = hero.player;
      if (!w) continue;
      if (p.dead || hero.away) {
        hero.work = null;
        continue;
      }
      if (Math.hypot(p.x - w.x, p.y - w.y) > 14) {
        cancelWork(hero, '✋ Interrompu : reste immobile pendant le travail.');
        continue;
      }
      if (time >= w.until) {
        hero.work = null;
        w.finish();
      }
    }
  }
  // Travail en cours d'un héros, pour l'animation : genre, avancement (0 à 1), cible, gisement.
  function workView(hero) {
    const w = hero.work;
    return w ? { kind: w.kind, p: Math.round(Math.min(1, (time - w.start) / (w.until - w.start)) * 100) / 100, tx: Math.round(w.tx), ty: Math.round(w.ty), node: w.node } : null;
  }
  function workOf(hero) {
    if (!hero) return null;
    if (game.mode !== 'guest') return workView(hero);
    if (hero === game.hero) return CANAAN_PROF.myLive().work || null;
    return hero.netAct || null;
  }
  function handle(hero, action) {
    if (action.op === 'gather') return startGather(hero, action.node);
    if (action.op === 'enchant-craft') return startCraft(hero, action.stat, action.tier, action.count);
    if (action.op === 'enchant-apply') return apply(hero, action.token, action.ref);
    return false;
  }
  // Enchantement enregistré valide (statistique secondaire connue, valeur entière, rang 0 à 5) ; sinon retiré.
  function cleanItem(item) {
    const e = item?.ench;
    if (!e) return item;
    if (!e || typeof e !== 'object' || !SECONDARY_KEYS.includes(e.stat) || !Number.isInteger(e.value) || e.value < 1 || e.value > 100000 || !Number.isInteger(e.tier) || e.tier < 0 || e.tier > 5) delete item.ench;
    return item;
  }

  // ---------------------------------------------------------------- Touche E et dessin des gisements
  function interact() {
    const i = nodeNear(P.x, P.y);
    if (i < 0) return false;
    if (myDepleted().has(i)) {
      toast(allNodes()[i].kind === 'ore' ? '⛏️ Ce filon est épuisé : il se reforme bientôt.' : '🌿 Déjà cueillie : elle repousse bientôt.');
      return true;
    }
    if (guest()) CANAAN_NET.requestAction({ op: 'gather', node: i });
    else startGather(game.hero, i);
    return true;
  }
  const sprites = new Map();
  function sprite(kind, id, empty) {
    const key = kind + id + (empty ? '-' : '');
    if (sprites.has(key)) return sprites.get(key);
    const cv = document.createElement('canvas');
    cv.width = 22;
    cv.height = 18;
    const g = cv.getContext('2d'),
      R = (x, y, w, h, c) => {
        g.fillStyle = c;
        g.fillRect(x, y, w, h);
      };
    if (kind === 'ore') {
      const col = ORES[id].color;
      if (empty) {
        R(5, 12, 4, 3, '#7a7e86');
        R(10, 13, 5, 2, '#6a6e76');
        R(15, 11, 3, 4, '#8a8e96');
      } else {
        R(4, 6, 14, 10, '#7a7e86');
        R(3, 9, 16, 6, '#7a7e86');
        R(6, 4, 9, 3, '#8a8e96');
        R(5, 6, 6, 3, '#9aa0a8');
        R(4, 14, 15, 2, '#5a5e66');
        for (const [x, y] of [[7, 8], [12, 6], [14, 11], [9, 12], [16, 9]]) {
          R(x, y, 2, 2, col);
          R(x, y, 1, 1, '#ffffffaa');
        }
      }
    } else {
      const col = HERBS[id].color;
      R(8, 15, 7, 2, '#3a2a1e55');
      if (empty) {
        R(10, 11, 1, 5, '#5a7a3a');
        R(12, 12, 1, 4, '#5a7a3a');
      } else {
        R(10, 6, 1, 10, '#3a7a3a');
        R(7, 9, 4, 2, '#4a9a4a');
        R(11, 7, 4, 2, '#4a9a4a');
        R(6, 12, 4, 2, '#3a8a3a');
        R(12, 11, 4, 2, '#3a8a3a');
        for (const [x, y] of [[9, 4], [13, 5], [7, 7], [14, 9]]) {
          R(x, y, 2, 2, col);
          R(x, y, 1, 1, '#ffffffaa');
        }
      }
    }
    const out = typeof canaanOutline === 'function' ? canaanOutline(cv, 1) : cv;
    sprites.set(key, out);
    return out;
  }
  // Fissures d'un filon selon l'avancement du minage : des traits sombres qui s'allongent et se ramifient.
  const CRACKS = [
    [[0.5, 0.3], [0.42, 0.5], [0.5, 0.66], [0.44, 0.86]],
    [[0.42, 0.5], [0.28, 0.58], [0.2, 0.74]],
    [[0.5, 0.66], [0.66, 0.72], [0.78, 0.62]],
    [[0.5, 0.3], [0.64, 0.38], [0.72, 0.5]],
    [[0.28, 0.58], [0.3, 0.42]]
  ];
  function cracks(c, n, p, w, h) {
    const x0 = n.x - w / 2,
      y0 = n.y - h + 14;
    c.save();
    c.strokeStyle = '#1a1418';
    c.lineWidth = 2;
    c.lineCap = 'round';
    CRACKS.forEach((path, k) => {
      const share = Math.min(1, Math.max(0, p * CRACKS.length * 1.1 - k));
      if (share <= 0) return;
      c.beginPath();
      const segs = (path.length - 1) * share;
      c.moveTo(x0 + path[0][0] * w, y0 + path[0][1] * h);
      for (let i = 1; i <= Math.ceil(segs); i++) {
        const t = Math.min(1, segs - (i - 1)),
          [ax, ay] = path[i - 1],
          [bx, by] = path[i];
        c.lineTo(x0 + (ax + (bx - ax) * t) * w, y0 + (ay + (by - ay) * t) * h);
      }
      c.stroke();
    });
    // Lueur du métal dans les fissures à la fin.
    if (p > 0.6) {
      c.globalAlpha = (p - 0.6) * 1.6;
      c.fillStyle = ORES[n.id].color;
      c.beginPath();
      c.arc(n.x, y0 + h * 0.58, 5 + p * 4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  // Travaux en cours visibles ici, par gisement (hôte : tous les héros ; invité : le sien et ceux des autres).
  let works = new Map();
  function draw(c) {
    if (game.world.instance) return;
    works = new Map();
    for (const hero of game.heroes) {
      const w = workOf(hero);
      if (w && w.node >= 0) works.set(w.node, w);
    }
    const gone = myDepleted(),
      near = nodeNear(P.x, P.y);
    c.save();
    c.imageSmoothingEnabled = false;
    allNodes().forEach((n, i) => {
      if (!canaanHere(n)) return;
      if (Math.abs(n.x - camX - W / 2) > W / 2 + 60 || Math.abs(n.y - camY - H / 2) > H / 2 + 60) return;
      const empty = gone.has(i),
        img = sprite(n.kind, n.id, empty),
        bob = !empty && n.kind === 'herb' ? Math.sin(time * 0.05 + i) * 0.6 : 0;
      const k = n.kind === 'ore' ? 2.6 : 2.3;
      // Filon ou herbe en cours de récolte : il tremble à chaque coup, et le minerai se fissure peu à peu.
      const job = works.get(i),
        hitShake = job ? Math.max(0, Math.sin(job.p * Math.PI * 2 * (WORK.mine / 0.6))) : 0,
        sx = job ? Math.round(Math.sin(time * 1.7) * 1.4 * hitShake) : 0;
      c.drawImage(img, Math.round(n.x - (img.width * k) / 2) + sx, Math.round(n.y - img.height * k + 14 + bob), Math.round(img.width * k), Math.round(img.height * k));
      if (job && n.kind === 'ore') cracks(c, n, job.p, img.width * k, img.height * k);
      if (i === near && !empty && !job) {
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#fff2cb';
        c.fillText(n.kind === 'ore' ? '[E] Miner' : '[E] Cueillir', n.x, n.y - img.height * k + 6);
      }
    });
    c.restore();
  }

  // ---------------------------------------------------------------- Onglets du panneau P
  const ui = { stat: 'crit', apply: null };
  const qualityName = q => GEAR_RARITIES[q]?.name || 'Commun';
  const qualityColor = q => GEAR_RARITIES[q]?.color || '#aeb4c0';
  function stockOf(kind) {
    return CANAAN_BAG.piles(game.hero).filter(p => p.kind === kind);
  }
  function tabMining(h) {
    const ores = stockOf('ore');
    return (
      h.bar('mining') +
      '<p class="prof-help">Repère les filons (rochers aux éclats colorés) et appuie sur <b>E</b> : chaque filon donne 1 à 3 minerais, puis se reforme au bout de 90 s. Un métal par biome : ' +
      Object.values(ORES).filter(o => !o.rare).map(o => o.icon + ' ' + esc(o.metal)).join(' · ') + '. Plus ton niveau est haut, meilleure est la qualité.</p>' +
      '<h3>Minerais dans ton sac</h3>' + (ores.length ? '<div class="prof-grid">' + ores.map(p => '<div class="prof-item"><span style="color:' + qualityColor(p.q) + '">' + ORES[p.id].icon + ' ' + esc(ORES[p.id].name) + '</span><small>' + esc(qualityName(p.q)) + '</small><b>× ' + p.n + '</b></div>').join('') + '</div>' : '<p class="prof-empty">Aucun minerai pour l’instant.</p>') +
      '<p class="prof-help">Les minerais servent à l’enchanteur (onglet Enchantement).</p>'
    );
  }
  function tabHerbalism(h) {
    const herbs = stockOf('herb');
    return (
      h.bar('herbalism') +
      '<p class="prof-help">Cueille les herbes sauvages (petites plantes fleuries) avec <b>E</b> : elles repoussent au bout de 90 s. Une herbe par biome : ' +
      Object.values(HERBS).map(o => o.icon + ' ' + esc(o.name) + ' (' + esc(o.where) + ')').join(' · ') + '. On les cuisine en infusions (onglet Cuisine).</p>' +
      '<h3>Herbes dans ton sac</h3>' + (herbs.length ? '<div class="prof-grid">' + herbs.map(p => '<div class="prof-item"><span style="color:' + qualityColor(p.q) + '">' + HERBS[p.id].icon + ' ' + esc(HERBS[p.id].name) + '</span><small>' + esc(qualityName(p.q)) + '</small><b>× ' + p.n + '</b></div>').join('') + '</div>' : '<p class="prof-empty">Aucune herbe pour l’instant.</p>')
    );
  }
  function tabEnchanting(h) {
    const prof = CANAAN_PROF.profOf(game.hero),
      level = prof.enchanting.level,
      stats = Object.keys(ENCHANTS);
    let html =
      h.bar('enchanting') +
      '<p class="prof-help">' + ORES_PER_ENCHANT + ' minerais d’un même métal donnent un enchantement. Choisis sa statistique, puis le métal : plus le métal est rare, plus l’enchantement est fort.' +
      ' Chaque métal demande un niveau d’enchanteur (cuivre 1, étain 5, fer 10, argent 15, or 20, mithril 25) : commence par le cuivre pour progresser. Ton niveau (' + level + ') renforce aussi les enchantements que tu poses de ' + level + ' %. Posé sur une pièce d’équipement, il lui ajoute cette statistique en troisième secondaire (un nouvel enchantement remplace l’ancien).</p>' +
      (nearForge(game.hero)
        ? '<p class="prof-active"><b>⚒️ Tu es à la forge</b> : fabriquer un enchantement prend 10 s (2 s de plus par enchantement en série). Reste immobile pendant le travail.</p>'
        : '<p class="prof-active warn">⚒️ Les enchantements se fabriquent à la <b>forge du Camp de l’Aurore</b> (à l’est du feu de camp). Tu peux poser ceux que tu as n’importe où.</p>') +
      (canaanBagUsed(game.hero) >= canaanBagLimit(game.hero) ? '<p class="prof-active warn">🎒 Ton sac est plein : libère une case pour ranger l’enchantement (sauf s’il complète une pile).</p>' : '') +
      '<div class="prof-tabs ench-stats">' + stats.map(s => '<button type="button" class="' + (ui.stat === s ? 'on' : '') + '" data-action="enchantStat" data-stat="' + s + '">' + ENCHANTS[s].icon + ' ' + esc(SECONDARY_STATS[s].name) + '</button>').join('') + '</div>' +
      '<div class="prof-recipes">' +
      METALS.map((metal, tier) => {
        const o = ORES[metal],
          have = Array.from({ length: 8 }, (_, q) => CANAAN_BAG.count(game.hero, 'ore', metal, q)).reduce((a, b) => a + b, 0),
          forge = nearForge(game.hero),
          locked = levelTooLow(game.hero, tier),
          ok = forge && have >= ORES_PER_ENCHANT && !locked,
          pct = Math.round(ENCH_MULT[tier] * levelBonus(game.hero) * 100),
          // Pourquoi on ne peut pas encore forger : la raison, en clair.
          why = locked
            ? levelText(game.hero, tier)
            : have < ORES_PER_ENCHANT
              ? 'Il te manque ' + (ORES_PER_ENCHANT - have) + ' ' + o.name.toLowerCase() + '.'
              : !forge
                ? 'Va à la forge du camp.'
                : '';
        return (
          '<article class="prof-recipe' + (locked ? ' locked' : '') + '"><h4>' + ENCHANTS[ui.stat].icon + ' ' + esc(SECONDARY_STATS[ui.stat].name) + ' · ' + esc(o.metal) + ' <small>niv. ' + ENCH_LEVEL[tier] + '</small></h4>' +
          '<p>' + o.icon + ' ' + ORES_PER_ENCHANT + ' × ' + esc(o.name) + ' (tu en as ' + have + ') · force ' + pct + ' % de la base de l’objet</p>' +
          (why ? '<p class="prof-empty">' + esc(why) + '</p>' : '') +
          '<div class="prof-actions"><button type="button" data-action="enchantCraft" data-stat="' + ui.stat + '" data-tier="' + tier + '"' + (ok ? '' : ' disabled') + '>Créer</button>' +
          (have >= ORES_PER_ENCHANT * 2 && ok ? '<button type="button" data-action="enchantCraft" data-stat="' + ui.stat + '" data-tier="' + tier + '" data-count="' + Math.min(20, Math.floor(have / ORES_PER_ENCHANT)) + '">× ' + Math.min(20, Math.floor(have / ORES_PER_ENCHANT)) + '</button>' : '') +
          '</div></article>'
        );
      }).join('') +
      '</div>';
    // Poser un enchantement : choisir l'enchantement, puis la pièce.
    const owned = stockOf('ench');
    html += '<h3>Poser un enchantement</h3>';
    if (!owned.length) return html + '<p class="prof-empty">Aucun enchantement dans ton sac.</p>';
    if (!owned.some(p => CANAAN_BAG.token({ ...p, n: 1 }) === ui.apply)) ui.apply = CANAAN_BAG.token({ ...owned[0], n: 1 });
    html +=
      '<div class="modern-bag ench-pick">' +
      owned.map(p => '<div class="bag-sale-wrap' + (CANAAN_BAG.token({ ...p, n: 1 }) === ui.apply ? ' picked' : '') + '">' + CANAAN_BAG.cell(p, 'data-action="enchantPick" data-token="' + esc(CANAAN_BAG.token({ ...p, n: 1 })) + '"') + '</div>').join('') +
      '</div><p class="prof-help">Puis clique la pièce à enchanter (portée ou dans ton sac) :</p>';
    const pick = CANAAN_BAG.parse(ui.apply),
      gear = [
        ...Object.entries(game.hero.equipment).filter(([slot, it]) => it && it.slot !== 'artifact').map(([slot, it]) => [it, slot, true]),
        ...game.hero.inventory.filter(it => it && it.slot !== 'artifact').map(it => [it, it.id, false])
      ];
    html +=
      '<div class="modern-bag ench-targets">' +
      gear
        .map(([it, ref, worn]) => {
          const rarity = rarityInfo(it),
            icon = weaponIcon(it) || itemIcon[it.slot],
            next = pick ? value(it, pick.q, game.hero) : 0;
          return (
            '<div class="bag-sale-wrap"><button type="button" class="bag-cell' + (worn ? ' worn' : '') + '"' + canaanPrestige(it) + ' style="border-color:' + rarity.color + ';--rarity:' + rarity.color + '" data-action="enchantApply" data-ref="' + esc(ref) + '" title="' +
            esc(gearDisplayName(it) + (worn ? ' (portée)' : '') + (it.ench ? ' · actuel : +' + it.ench.value + ' ' + SECONDARY_STATS[it.ench.stat].name : '') + (pick ? ' · deviendra : +' + next + ' ' + SECONDARY_STATS[pick.id].name : '')) + '">' +
            '<span class="bag-icon">' + icon + '</span><span class="bag-name">' + esc(gearDisplayName(it)) + '</span>' + (it.ench ? '<span class="ench-mark">' + ENCHANTS[it.ench.stat].icon + '</span>' : '') + '<span class="bag-ilvl">' + itemLevel(it) + '</span></button></div>'
          );
        })
        .join('') +
      '</div>';
    return html;
  }
  const act = action => {
    const done = guest() ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    CANAAN_PROF.render();
    return done;
  };
  const actions = {
    stat(s) {
      if (ENCHANTS[s]) ui.stat = s;
      CANAAN_PROF.render();
    },
    pick(token) {
      ui.apply = token;
      CANAAN_PROF.render();
    },
    // Créer : la fenêtre se ferme pour laisser voir le travail à la forge.
    craft(stat, tier, count = 1) {
      closePanels();
      return act({ op: 'enchant-craft', stat, tier, count });
    },
    apply: ref => (ui.apply ? act({ op: 'enchant-apply', token: ui.apply, ref }) : false),
    // Depuis le sac (I) : ouvrir l'onglet Enchantement avec cet enchantement choisi.
    use(token) {
      ui.apply = token.replace(/\*\d+$/, '*1');
      CANAAN_PROF.open('enchant');
    }
  };

  window.CANAAN_GATHER = Object.freeze({
    ORES,
    HERBS,
    ENCHANTS,
    METALS,
    ENCH_MULT,
    ENCH_LEVEL,
    nodes: allNodes,
    nodeNear,
    depleted,
    gather,
    craft,
    apply,
    value,
    handle,
    startGather,
    startCraft,
    startCook,
    stepWork,
    cancelWork,
    workOf,
    workView,
    nearForge,
    forgeSpot,
    // Gisements de l'île calculés à la surface (avant de descendre dans les Tréfonds).
    prepare: () => allNodes().length,
    cleanItem,
    interact,
    draw,
    tabs: { mining: tabMining, herbalism: tabHerbalism, enchant: tabEnchanting },
    actions
  });
})();
