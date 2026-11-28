// Histoire « Les Échos de l'Aurore » et quêtes (shared/data/quests.js, shared/rules/quests.js) : lieux, personnages,
// progression, dialogues, journal, gardiens, troc et coquillages. Les objectifs de terrain (chasse, escorte, défense,
// poursuite, course, champion…) sont dans quest-field.js.
// - Lieux : posés sur l'île après sa génération (mêmes cases chez chacun), et ceux de l'Interlude dans les Tréfonds
//   (placeUnder, appelé par underground.js), avec leurs énigmes, PNJ et objets.
// - Progression personnelle (hero.quetes, sauvegardée) : quêtes actives et étapes, terminées, drapeaux,
//   choix ; l'état des énigmes et les changements du monde (pont, lanternes, sanctuaires) sont partagés
//   (monde.quetes, sauvegardé par l'hôte). Une énigme résolue à plusieurs compte pour chaque héros qui l'a en cours.
// - Touche E : parler aux PNJ et agir sur les énigmes ; touche L : journal (histoire, secondaires, terminées).
// - En ligne : l'hôte décide de tout ; un invité demande ses actions (quest-*) et reçoit sa progression et l'état
//   des lieux.
// Ce fichier garde l'état, la progression, les gardiens, le troc, le suivi et le réseau ; les lieux et les énigmes
// sont dans scripts/quests/sites.js, les dialogues et le journal dans dialogs.js, tout le dessin dans render.js.
(() => {
  'use strict';
  const T = TS;
  const SITES = {};
  const NPCS = {};
  // Passage dans les lieux : case → fonction (vrai : praticable, faux : bloqué).
  const WALK = new Map();
  // Même chose dans les Tréfonds (lieux de l'Interlude).
  const WALK_UNDER = new Map();
  const tileKey = (tx, ty) => ty * MAPW + tx;
  const now = () => time;
  const guest = () => game.mode === 'guest';
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const fresh = () => ({
    active: {},
    done: {},
    flags: {},
    choices: {},
    track: null,
    troc: 0,
    shells: [],
    paid: 0,
    v: QUEST_VERSION,
    guild: sanitizeGuild(null)
  });
  const stateOf = hero => {
    const st = (hero.quetes ??= fresh());
    st.troc ??= 0;
    st.shells ??= [];
    st.paid ??= 0;
    st.v ??= QUEST_VERSION;
    st.guild ??= sanitizeGuild(null);
    return st;
  };
  // État du monde : drapeaux (pont, lanternes, sanctuaires ouverts…) et énigmes résolues.
  let qworld = { flags: {}, solved: {} };
  // État vivant des énigmes partagées (non sauvegardé, sauf ce qui est résolu).
  let ST = {};
  let version = 1;
  const changed = () => version++;

  // État relu par les modules (scripts/quests/*.js) : variables réassignées ou posées plus tard.
  const LIVE = {
    get qworld() {
      return qworld;
    },
    get ST() {
      return ST;
    },
    set ST(v) {
      ST = v;
    },
    get raised() {
      return raised;
    },
    get guideTo() {
      return guideTo;
    },
    get FIELD() {
      return FIELD;
    }
  };
  // ---------------------------------------------------------------- Lieux et énigmes (scripts/quests/sites.js)
  const {
    px,
    py,
    addObj,
    place,
    surfaceSites,
    here,
    placeUnder,
    WAYSTONE,
    CONSTELLATION,
    beamOf,
    leafAt,
    actMore,
    stepMore
  } = CANAAN_QUEST_SITES.create({
    state: LIVE,
    T,
    SITES,
    NPCS,
    WALK,
    WALK_UNDER,
    tileKey,
    now,
    guest,
    stateOf,
    changed,
    stepGuardians,
    at,
    tell,
    advance,
    solve,
    creditSolved,
    cue,
    panel
  });

  // ---------------------------------------------------------------- Au fil de l'aventure : gardiens, troc, coquillages
  // Gardiens de l'Ombre (GUARDIANS) : un sceau dans le lieu de chaque fin de chapitre ; le briser (E) appelle le
  // gardien, un vrai boss (barre en haut de l'écran, PV et coups de boss) avec ses attaques annoncées au sol. Vaincu :
  // l'étape avance pour chaque héros proche qui l'a en cours, et chacun reçoit son Cœur d'Aurore (PV max), même s'il
  // avait fini la quête avant l'arrivée des gardiens. Perdu (tout le monde à terre ou parti) : le sceau attend.
  const FIGHTS = {};
  // Attaques annoncées : centre, rayon, explosion à l'instant `at`, multiplicateur du coup du gardien.
  const zones = [];
  // Un gardien a 60 % des PV d'un boss de donjon de son niveau : un vrai combat, pas une épreuve d'endurance.
  const GUARDIAN_HP = 0.6;
  const heartFlag = q => 'heart_q' + q.id;
  const guardianOf = q => (q ? GUARDIANS[q.id] || null : null);
  const heroesNear = (x, y, r, dead = false) =>
    game.heroes.filter(
      h => (dead || !h.player.dead) && !h.away && Math.hypot(h.player.x - x, h.player.y - y) < r
    );
  // Le héros peut défier le gardien : il en est à cette étape, ou il a fini la quête sans en avoir le cœur.
  function guardianDue(hero, q) {
    if (!guardianOf(q)) return false;
    const st = stateOf(hero);
    return !!at(hero, q, 'guardian') || (!!st.done[q.id] && !st.flags[heartFlag(q)]);
  }
  function summonGuardian(site, hero) {
    const q = site.quest,
      g = guardianOf(q),
      seal = site.objs.find(o => o.kind === 'gseal');
    if (!g || !seal || FIGHTS[site.id] || !guardianDue(hero, q)) return false;
    const cx = px(site, 0),
      cy = py(site, 0),
      // Au niveau de la quête, ou du héros le plus fort présent : le gardien reste un défi.
      level = clampLevel(
        Math.max(questLevel(q), ...heroesNear(cx, cy, 16 * T).map(h => clampLevel(h.level)))
      ),
      m = {
        x: seal.x,
        y: seal.y - T,
        hp: 1,
        mhp: 1,
        level,
        t: g.name,
        r: 24,
        cd: 1.2,
        g: 40 + level * 8,
        boss: true,
        questGuardian: site.id,
        look: g.look,
        pal: [...g.pal],
        lookOpts: { ...g.opts },
        mobColor: g.color,
        bossColor: g.color,
        scale: g.scale,
        under: !!site.under
      };
    game.world.monsters.push(m);
    scaleBossHp(m);
    m.mhp = m.hp = Math.max(1, Math.round(m.mhp * GUARDIAN_HP));
    const t = now();
    FIGHTS[site.id] = { m, adds: 0, slam: t + 180, rain: t + 360, nova: t + 300, blink: t + 480 };
    burst(m.x, m.y, g.color, 40);
    burst(seal.x, seal.y, '#2a1a3e', 30);
    for (const h of heroesNear(cx, cy, 16 * T)) tell(h, '⚔️ ' + g.intro);
    changed();
    return true;
  }
  function warn(m, x, y, r, delay, mult) {
    zones.push({ m, x, y, r, at: now() + delay, start: now(), mult });
    if (typeof CANAAN_SKILLS !== 'undefined') CANAAN_SKILLS.fx('ring', x, y, 0, r, 0, '#ff3a2a', delay / 60);
  }
  function explode(z) {
    burst(z.x, z.y, '#ff6a3a', 22);
    if (typeof CANAAN_SKILLS !== 'undefined') CANAAN_SKILLS.fx('ring', z.x, z.y, 0, z.r, 0, '#ffb070', 0.4);
    if (!z.m || z.m.hp <= 0) return;
    const raw = CANAAN_ENEMY_RAW_DAMAGE(z.m) * z.mult;
    for (const hero of heroesNear(z.x, z.y, z.r))
      CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(z.m, raw, {}, hero), z.m, hero);
  }
  // Renforts : deux créatures de l'espèce du gardien, à son niveau.
  function spawnAdds(site, m, g) {
    const type = MOB_TYPES.find(t => t.name === g.adds) || MOB_TYPES[0];
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * Math.PI * 2;
      let x = m.x + Math.cos(a) * 2.5 * T,
        y = m.y + Math.sin(a) * 2.5 * T;
      if (!canWalk(x, y)) [x, y] = [m.x, m.y];
      const hp = mobHealth(m.level, false, type.hp);
      game.world.monsters.push({
        x,
        y,
        hp,
        mhp: hp,
        level: m.level,
        t: type.name,
        r: 16,
        cd: 1,
        g: 0,
        mobColor: type.color,
        elite: false,
        questAdd: site.id,
        _levelHp: true
      });
    }
    float(m.x, m.y - 80, '📯 ' + m.t + ' appelle des renforts !', '#ffb0ff');
  }
  // Disparaît dans un nuage d'ombre et réapparaît ailleurs dans le lieu.
  function blink(site, m) {
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2,
        d = (1 + Math.random() * Math.max(1, site.r - 1)) * T,
        x = px(site, 0) + Math.cos(a) * d,
        y = py(site, 0) + Math.sin(a) * d;
      if (!canWalk(x, y)) continue;
      burst(m.x, m.y, m.bossColor, 24);
      [m.x, m.y] = [x, y];
      burst(x, y, m.bossColor, 24);
      float(x, y - 90, '🌀 ' + m.t + ' disparaît !', '#c8a0ff');
      return;
    }
  }
  function stepGuardians() {
    const t = now();
    for (const [id, F] of Object.entries(FIGHTS)) {
      const site = SITES[id],
        m = F.m,
        g = guardianOf(site.quest),
        cx = px(site, 0),
        cy = py(site, 0);
      if (m.hp <= 0) {
        endFight(site, true);
        continue;
      }
      // Retiré du monde sans être vaincu (héros trop loin), ou plus personne debout près du lieu : le sceau attend.
      if (!game.world.monsters.includes(m) || !heroesNear(cx, cy, (site.r + 12) * T).length) {
        endFight(site, false);
        continue;
      }
      // Le gardien ne quitte pas son lieu.
      if (Math.hypot(m.x - cx, m.y - cy) > (site.r + 5) * T) {
        burst(m.x, m.y, g.color, 16);
        [m.x, m.y] = [cx, cy];
      }
      const ratio = m.hp / m.mhp,
        pace = m.enraged ? 0.7 : 1,
        targets = heroesNear(m.x, m.y, 12 * T);
      if (!targets.length) continue;
      const pick = () => targets[Math.floor(Math.random() * targets.length)];
      if (g.moves.includes('slam') && t >= F.slam) {
        F.slam = t + 300 * pace;
        const h = pick();
        warn(m, h.player.x, h.player.y, 1.8 * T, 80, 1.6);
        float(m.x, m.y - 80, '⚠️ Coup de l’Ombre !', '#ff8a6a');
      }
      if (g.moves.includes('rain') && t >= F.rain) {
        F.rain = t + 600 * pace;
        for (const h of targets)
          warn(
            m,
            h.player.x + (Math.random() - 0.5) * 40,
            h.player.y + (Math.random() - 0.5) * 40,
            1.3 * T,
            75,
            1.1
          );
        float(m.x, m.y - 80, '⚠️ Pluie d’éclats !', '#ff8a6a');
      }
      if (g.moves.includes('nova') && t >= F.nova) {
        F.nova = t + 540 * pace;
        warn(m, m.x, m.y, 3.4 * T, 90, 1.4);
        float(m.x, m.y - 90, '⚠️ Onde de l’Ombre !', '#ff8a6a');
      }
      if (g.moves.includes('blink') && t >= F.blink) {
        F.blink = t + 480 * pace;
        blink(site, m);
      }
      const stage = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
      if (stage > F.adds) {
        F.adds = stage;
        spawnAdds(site, m, g);
      }
      if (ratio < 0.25 && !m.enraged) {
        m.enraged = true;
        float(m.x, m.y - 100, '😡 ' + m.t + ' entre en rage !', '#ff4a3a');
        burst(m.x, m.y, '#ff2a1a', 30);
      }
    }
    for (let i = zones.length - 1; i >= 0; i--)
      if (now() >= zones[i].at) {
        const [z] = zones.splice(i, 1);
        explode(z);
      }
  }
  function endFight(site, win) {
    const F = FIGHTS[site.id],
      q = site.quest,
      g = guardianOf(q);
    delete FIGHTS[site.id];
    game.world.monsters = game.world.monsters.filter(x => x !== F.m && x.questAdd !== site.id);
    for (let i = zones.length - 1; i >= 0; i--) if (zones[i].m === F.m) zones.splice(i, 1);
    const around = heroesNear(px(site, 0), py(site, 0), (site.r + 16) * T, true);
    if (win) {
      burst(F.m.x, F.m.y, '#ffe9a0', 50);
      for (const h of around) {
        if (!guardianDue(h, q)) continue;
        tell(h, '✨ ' + g.defeat);
        const st = stateOf(h);
        if (!st.flags[heartFlag(q)]) {
          st.flags[heartFlag(q)] = true;
          recomputeHeroStats(h);
          tell(h, '❤️ Cœur d’Aurore : PV max +3 % (' + heartCount(st) + ' / ' + HEART_FLAGS.length + ')');
        }
        if (at(h, q, 'guardian')) advance(h, q);
      }
      window.CANAAN_PERSISTENCE.requestSave();
    } else
      for (const h of around) tell(h, '🌑 ' + g.name + ' retourne dans l’ombre… Le sceau attend ton retour.');
    changed();
  }

  // Le grand troc (TRADE_CHAIN) : chaque habitant donne son objet contre celui du précédent.
  const tradeAt = (hero, npcId) => {
    const t = TRADE_CHAIN[stateOf(hero).troc];
    return t && t.npc === npcId ? t : null;
  };
  function trade(hero, npcId) {
    const st = stateOf(hero),
      t = tradeAt(hero, npcId),
      npc = NPCS[npcId];
    if (!t || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T) return false;
    st.troc++;
    tell(hero, '🎁 ' + t.gives.icon + ' ' + t.gives.name + ' — ' + t.hint);
    if (st.troc >= TRADE_CHAIN.length) {
      hero.player.gold += TRADE_FINAL.gold;
      giveGear(clampLevel(hero.level), 'quest', TRADE_FINAL.item, hero);
      tell(hero, '🏆 Grand troc terminé · +' + TRADE_FINAL.gold + ' or · ' + TRADE_FINAL.text);
    }
    if (hero === game.hero) CANAAN_SOUND.cue('fanfare');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Coquillages chantants (SHELLS) : un par lieu, ramassé par chacun pour soi.
  const hasLoupe = hero => stateOf(hero).troc >= TRADE_CHAIN.length;
  function pickShell(hero, o) {
    const st = stateOf(hero);
    if (st.shells.includes(o.shell)) return false;
    st.shells.push(o.shell);
    tell(hero, '🐚 Coquillage chantant ! (' + st.shells.length + ' / ' + SHELLS.length + ')');
    if (shellRewardsDue(st).length)
      tell(hero, '🐚 Madame Nacre, au Camp de l’Aurore, aimerait voir ta collection.');
    burst(o.x, o.y, '#ffd8f0', 18);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Paliers de la collection, récompensés par Madame Nacre.
  function claimShells(hero) {
    const st = stateOf(hero),
      npc = NPCS.nacre,
      due = shellRewardsDue(st);
    if (!npc || !due.length || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    for (const r of due) {
      st.paid++;
      hero.player.gold += r.gold;
      if (r.item) giveGear(clampLevel(hero.level), 'quest', r.item, hero);
      if (r.heart) {
        st.flags[r.heart] = true;
        recomputeHeroStats(hero);
      }
      tell(hero, '🐚 Palier de ' + r.n + ' coquillages · +' + r.gold + ' or · ' + r.text);
    }
    if (hero === game.hero) CANAAN_SOUND.cue('fanfare');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Coquillage le plus proche pas encore trouvé (boussole de la Loupe d'Orven), à moins de 60 cases.
  function shellTarget(hero) {
    if (!hasLoupe(hero)) return null;
    const st = stateOf(hero);
    let best = null,
      bd = 60 * T;
    for (const site of Object.values(SITES))
      for (const o of site.objs) {
        if (o.kind !== 'shell' || st.shells.includes(o.shell)) continue;
        const d = Math.hypot(hero.player.x - o.x, hero.player.y - o.y);
        if (d < bd) [best, bd] = [o, d];
      }
    return (
      best && {
        x: best.x,
        y: best.y,
        text: 'La Loupe d’Orven entend un coquillage',
        q: { title: 'Coquillage chantant', main: false }
      }
    );
  }

  // Fanfare « objet obtenu » : à chaque objet du troc, coquillage, Cœur d'Aurore ou étoile, le héros brandit sa
  // trouvaille au-dessus de sa tête et une bannière s'affiche. Tirée de l'état du héros local (hôte comme invité,
  // qui reçoit le sien de l'hôte) : rien de plus à envoyer sur le réseau.
  const fanfareEl = document.createElement('div');
  fanfareEl.id = 'questFanfare';
  fanfareEl.hidden = true;
  document.body.appendChild(fanfareEl);
  const fanfares = [];
  let fanfareUntil = 0,
    raised = null,
    seen = null;
  const stateMark = st => ({
    troc: st.troc,
    shells: st.shells.length,
    hearts: heartCount(st),
    stars: starCount(st),
    lumi: !!st.flags.lumi
  });
  function fanfare(icon, title, text, kind = 'item') {
    fanfares.push({ icon, title, text, kind });
  }
  function watchFanfare() {
    if (!started) {
      seen = null;
      return;
    }
    const st = stateOf(game.hero),
      cur = stateMark(st);
    if (seen) {
      // Une aventure chargée (beaucoup de changements d'un coup) ne déclenche rien.
      const jumps =
        cur.troc -
        seen.troc +
        (cur.shells - seen.shells) +
        (cur.hearts - seen.hearts) +
        (cur.stars - seen.stars);
      if (jumps > 0 && jumps <= 3) {
        if (cur.troc > seen.troc) {
          const t = TRADE_CHAIN[cur.troc - 1];
          fanfare(t.gives.icon, t.gives.name, t.desc);
        }
        if (cur.shells > seen.shells)
          fanfare(
            '🐚',
            'Coquillage chantant',
            cur.shells + ' / ' + SHELLS.length + ' — Madame Nacre, au Camp de l’Aurore, les collectionne.'
          );
        if (cur.hearts > seen.hearts)
          fanfare('❤️', 'Cœur d’Aurore', 'PV max +3 % (' + cur.hearts + ' / ' + HEART_FLAGS.length + ')');
        if (cur.stars > seen.stars)
          fanfare(
            '✦',
            'Étoile du Cœur',
            'Une étoile du Cœur de l’Aurore te rejoint (' + cur.stars + ' / 6).'
          );
      }
      if (cur.lumi && !seen.lumi)
        fanfare('✨', 'Lumi', 'Une petite lumière tombée du ciel devient ta compagne de voyage.');
    }
    seen = cur;
    // Carte de titre d'un gardien qui apparaît près du héros.
    for (const m of game.world.monsters)
      if (m.boss && !m._questIntro && GUARDIAN_NAMES.has(m.t) && Math.hypot(m.x - P.x, m.y - P.y) < 16 * T) {
        m._questIntro = true;
        const g = Object.values(GUARDIANS).find(g => g.name === m.t);
        fanfare('⚔️', g.name, g.title, 'boss');
      }
    if (time < fanfareUntil || !fanfares.length) {
      if (time >= fanfareUntil && !fanfareEl.hidden) fanfareEl.hidden = true;
      return;
    }
    const f = fanfares.shift();
    fanfareUntil = time + (f.kind === 'boss' ? 150 : 170);
    raised = f.kind === 'boss' ? null : { icon: f.icon, until: fanfareUntil };
    fanfareEl.className = f.kind;
    fanfareEl.innerHTML =
      '<i>' +
      esc(f.icon) +
      '</i><small>' +
      (f.kind === 'boss' ? 'Gardien' : 'Tu as obtenu') +
      '</small><b>' +
      esc(f.title) +
      '</b><span>' +
      esc(f.text) +
      '</span>';
    fanfareEl.hidden = false;
    CANAAN_SOUND.cue(f.kind === 'boss' ? 'wrong' : 'fanfare');
    if (f.kind !== 'boss') burst(P.x, P.y - 60, '#ffe9a0', 26);
  }
  const GUARDIAN_NAMES = new Set(Object.values(GUARDIANS).map(g => g.name));

  // ---------------------------------------------------------------- Progression d'un héros
  const quest = id => questById(id);
  const stepOf = (hero, q) => stateOf(hero).active[q.id]?.step ?? -1;
  // L'étape en cours d'un héros pour une quête, si elle est de ce type.
  function at(hero, q, k) {
    if (!q) return null;
    const st = stateOf(hero).active[q.id];
    return st && st.step < q.steps.length && q.steps[st.step].k === k ? st : null;
  }
  function tell(hero, text) {
    if (hero === game.hero) toast(text);
    else canaanLootNotice(hero, text);
  }
  function advance(hero, q) {
    const st = stateOf(hero).active[q.id];
    if (!st || st.step >= q.steps.length) return false;
    const ended = q.steps[st.step];
    st.step++;
    st.got = [];
    st.n = 0;
    // Le lieu change pour tout le monde.
    for (const f of ended.world || []) qworld.flags[f] = true;
    if (ended.world) changed();
    tell(
      hero,
      st.step >= q.steps.length
        ? '📜 ' + q.title + ' : retourne voir ' + whoTo(q) + '.'
        : '📜 Objectif accompli : ' + ended.text
    );
    if (hero === game.hero) CANAAN_SOUND.cue('puzzle');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function accept(hero, id) {
    const q = quest(id),
      st = stateOf(hero),
      npc = q && NPCS[q.npc];
    if (!q || !canStart(st, q) || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    st.active[q.id] = { step: 0, got: [], n: 0 };
    if (!st.track) st.track = q.id;
    tell(hero, '📜 Nouvelle quête : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Un avis de la guilde se rend à la maîtresse de guilde ; une demande d'habitant, à cet habitant.
  const nearGiver = (hero, q) => {
    if (q.npc === 'guilde') return CANAAN_GUILD.near(hero);
    const npc = NPCS[q.npc];
    return !!npc && Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) <= 3.5 * T;
  };
  // Personnage à qui rendre une quête (texte).
  const whoTo = q => (q.npc === 'guilde' ? GUILD_MASTER + ', à la guilde' : QUEST_NPCS[q.npc].name);
  function turnIn(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    if (!q || !questReady(st, q) || !nearGiver(hero, q)) return false;
    // Première fois : les récompenses propres à une demande d'habitant (recette, coffre, bijou…).
    const first = !st.done[q.id];
    delete st.active[q.id];
    st.done[q.id] = Date.now();
    if (st.track === q.id) st.track = Object.keys(st.active).map(Number)[0] || null;
    if (isContract(q)) rewardContract(hero, q, first);
    else reward(hero, q);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Prendre un contrat au tableau de la guilde (près de la maîtresse de guilde).
  function take(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    refreshBoard(st, hero.level, Date.now());
    if (!q || !CANAAN_GUILD.near(hero) || !canTakeContract(st, q)) return false;
    st.guild.taken.push(q.id);
    st.active[q.id] = { step: 0, got: [], n: 0 };
    st.track = q.id;
    tell(hero, '📜 Contrat accepté : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Renoncer au contrat en cours : il ne revient pas avant le prochain tableau.
  function abandon(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    if (!q || !isContract(q) || !st.active[q.id]) return false;
    delete st.active[q.id];
    if (st.track === q.id) st.track = Object.keys(st.active).map(Number)[0] || null;
    tell(hero, '📜 Contrat abandonné : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Contrat rendu : or, XP, renommée et équipement de son rang ; la première fois, la récompense propre à la demande.
  function rewardContract(hero, q, first) {
    const st = stateOf(hero),
      g = st.guild,
      rank = contractRank(q),
      level = clampLevel(hero.level),
      gold = questGold(q, level),
      before = guildRankIndex(g.fame);
    hero.player.gold += gold;
    g.fame += contractFame(q);
    g.count++;
    const r = q.reward;
    if (first) {
      for (const f of r.flags || []) st.flags[f] = true;
      if (r.jewel) giveJewel(hero, q);
      if (r.item === 'Légendaire') giveGear(level, 'quest', 'Légendaire', hero);
      if (r.fishXp || r.goldenFish)
        CANAAN_PROF.questReward(hero, { fishXp: r.fishXp || 0, goldenFish: r.goldenFish || 0 });
    }
    giveGear(level, 'quest', rank.better && Math.random() < rank.better ? 'Légendaire' : rank.item, hero);
    canaanGrantXp(hero, questXp(q, level), hero.player);
    tell(
      hero,
      '🏆 Contrat rempli : ' +
        q.title +
        ' · +' +
        gold +
        ' or · +' +
        contractFame(q) +
        ' renommée' +
        (first && (r.flags || r.jewel || r.recipe || r.fishXp || r.item === 'Légendaire')
          ? ' · ' + r.text
          : '')
    );
    if (hero === game.hero) {
      CANAAN_SOUND.cue('levelup');
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 30);
    }
    const after = guildRankIndex(g.fame);
    if (after > before) {
      const R = GUILD_RANKS[after];
      tell(hero, '🛡️ Nouveau rang de guilde : ' + R.id + ' · ' + R.title);
      if (hero === game.hero)
        fanfare('🛡️', 'Rang ' + R.id + ' · ' + R.title, 'Contrats ' + R.tier.toLowerCase());
      refreshBoard(st, hero.level, Date.now());
    }
  }
  function reward(hero, q) {
    const r = q.reward,
      st = stateOf(hero);
    const level = clampLevel(hero.level),
      gold = questGold(q, level);
    hero.player.gold += gold;
    for (const f of r.flags || []) {
      st.flags[f] = true;
      // Un sanctuaire ouvert l'est pour tout le monde.
      if (f.startsWith('sanct_')) qworld.flags[f] = true;
    }
    if (r.jewel) giveJewel(hero, q);
    if (r.item) giveGear(clampLevel(hero.level), 'quest', r.item, hero);
    if (r.fishXp || r.goldenFish)
      CANAAN_PROF.questReward(hero, { fishXp: r.fishXp || 0, goldenFish: r.goldenFish || 0 });
    canaanGrantXp(hero, questXp(q, level), hero.player);
    tell(hero, '🏆 Quête terminée : ' + q.title + ' · +' + gold + ' or · ' + r.text);
    if (hero === game.hero) {
      CANAAN_SOUND.cue('levelup');
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 30);
    }
    if (r.flags?.some(f => f.startsWith('star')))
      tell(hero, '✦ Une étoile du Cœur de l’Aurore te rejoint (' + starCount(st) + ' / 6).');
  }
  // Bijou du lac aux mille étoiles : Légendaire, au niveau du héros, avec deux secondaires tirées au hasard.
  function giveJewel(hero, q) {
    const slot = Math.random() < 0.5 ? 'ring' : 'neck',
      item = window.CANAAN_GEAR.normalize({
        id: 'q30-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
        name: slot === 'ring' ? 'Anneau des mille étoiles' : 'Collier des mille étoiles',
        slot,
        level: clampLevel(hero.level),
        rarity: 'Légendaire'
      });
    // Sac plein : il attend dans la sacoche de butin (ou part en poudres si elle est pleine).
    if (CANAAN_SALVAGE.deliver(hero, item) === 'bag') tell(hero, '💍 ' + item.name + ' (Légendaire) !');
  }
  // Une énigme partagée est résolue : chaque héros proche qui l'a en cours avance.
  function solve(site, at0) {
    qworld.solved[site.id] = true;
    changed();
    burst(px(site, 0), py(site, 0), '#ffe9a0', 34);
    for (const hero of game.heroes) {
      if (
        hero.player.dead ||
        hero.away ||
        Math.hypot(hero.player.x - px(site, 0), hero.player.y - py(site, 0)) > 14 * T
      )
        continue;
      if (at(hero, site.quest, 'puzzle')) advance(hero, site.quest);
    }
    window.CANAAN_PERSISTENCE.requestSave();
  }
  // Déjà résolue : celui qui a l'énigme en cours et touche au mécanisme est crédité.
  function creditSolved(hero, site) {
    if (!qworld.solved[site.id]) return false;
    if (at(hero, site.quest, 'puzzle')) advance(hero, site.quest);
    else tell(hero, '✨ Le mécanisme est déjà réglé.');
    return true;
  }

  // ---------------------------------------------------------------- Actions sur les objets
  function act(hero, site, o) {
    const q = site.quest,
      S = ST[site.id];
    if (o.kind === 'field') return FIELD.act(hero, site, o);
    switch (o.kind) {
      case 'gseal':
        return summonGuardian(site, hero);
      case 'shell':
        return pickShell(hero, o);
      case 'crystal':
        return tell(
          hero,
          stateOf(hero).flags.lumi
            ? '✨ Il ne reste que des éclats de lumière.'
            : '✨ Une petite lumière tremble dans le cristal. Il lui manque des éclats.'
        );
      case 'dig': {
        if (!at(hero, q, 'spot'))
          return stateOf(hero).done[q.id]
            ? tell(hero, 'Le trou est vide : tu as déjà trouvé le trésor.')
            : false;
        cue(hero, 'chest');
        burst(o.x, o.y, '#c8a060', 20);
        return advance(hero, q);
      }
      case 'ripple': {
        if (!at(hero, q, 'timing')) return false;
        if (S.gold === o.i && now() < S.until) {
          tell(hero, '🐟 Le poisson doré mord ! Tu le remontes, scintillant.');
          burst(o.x, o.y, '#ffd84a', 24);
          return advance(hero, q);
        }
        cue(hero, 'wrong');
        return tell(hero, '🐟 Juste une carpe… Attends le remous doré.');
      }
      case 'mstone': {
        const st = at(hero, q, 'collect');
        cue(hero, 'note' + o.pitch);
        if (!st || st.got.includes(o.id)) return float(o.x, o.y - 40, '♪', '#c8f0a0');
        st.got.push(o.id);
        tell(
          hero,
          '🎵 Pierre musicale trouvée (' +
            st.got.length +
            ' / 4). Son : ' +
            ['grave', 'doux', 'clair', 'aigu'][o.pitch - 1] +
            '.'
        );
        if (st.got.length >= 4) advance(hero, q);
        return true;
      }
      case 'chime':
        if (qworld.solved.q6) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1 && !stateOf(hero).done[q.id])
          return tell(hero, '🎵 Le socle attend sa pierre musicale. Retrouve-les dans la forêt.');
        cue(hero, 'note' + o.pitch);
        float(o.x, o.y - 40, '♪', '#c8f0a0');
        S.seq.push(o.pitch);
        if (S.seq.some((p, i) => p !== [1, 4, 2, 3][i])) {
          S.seq = [];
          cue(hero, 'wrong');
          tell(hero, '🎵 La mélodie se brise. Recommence.');
        } else if (S.seq.length === 4) {
          S.seq = [];
          qworld.flags.sanct_murmures = true;
          tell(hero, '🌿 La pierre roule sur le côté : le Sanctuaire des Murmures s’ouvre !');
          solve(site);
        }
        return changed();
      case 'waystone':
        return travel(hero, 'camp');
      case 'campstone':
        return travel(hero, 'forest');
      case 'viewpoint':
        if (!at(hero, q, 'spot')) return false;
        tell(
          hero,
          '🐦 L’ombre de l’arbre déploie ses ailes : un oiseau parfait. Théon accourt avec ses pinceaux !'
        );
        return advance(hero, q);
      case 'clue':
      case 'witness': {
        const c = GHOST_CLUES.find(c => c.id === o.clue),
          st = at(hero, q, 'clues');
        if (st && !st.got.includes(c.id)) {
          st.got.push(c.id);
          if (st.got.length >= 4) advance(hero, q);
        }
        return panel(hero, c.who ? '💬 ' + c.who : '🔎 Indice', c.what);
      }
      case 'shrine':
        return visitShrine(hero, o);
      case 'door':
        return tell(
          hero,
          qworld.flags['sanct_' + o.sanct]
            ? ''
            : '🗿 Une lourde porte de pierre. Elle ne bougera pas toute seule.'
        );
      case 'islechest':
        return tell(hero, '📦 Le coffre de l’îlot.');
    }
    return actMore(hero, site, o);
  }
  function cue(hero, name) {
    if (hero === game.hero) CANAAN_SOUND.cue(name);
  }
  // Panneau de texte (stèle, indice) : chez le joueur concerné seulement.
  function panel(hero, title, text) {
    if (hero !== game.hero) return canaanLootNotice(hero, title + ' — ' + text);
    modernPanel(
      '<div class="quest-dialog"><h2>' +
        esc(title) +
        '</h2><p class="quest-text">' +
        esc(text) +
        '</p><div class="quest-buttons"><button data-action="closePanels">D’accord</button></div></div>'
    );
    return true;
  }
  function travel(hero, to) {
    if (!stateOf(hero).flags.shortcut)
      return tell(
        hero,
        '🪨 Une pierre de passage endormie. On dit qu’une fois réveillée, elle relie la forêt au camp.'
      );
    const dest = WAYSTONE[to];
    if (!dest) return false;
    hero.player.x = dest.x;
    hero.player.y = dest.y + T;
    burst(dest.x, dest.y, '#9fe8ff', 24);
    tell(hero, '🌀 La pierre de passage t’emporte…');
    return true;
  }
  function visitShrine(hero, o) {
    if (!qworld.flags['sanct_' + o.sanct]) return false;
    const s = SANCTUARIES.find(s => s.id === o.sanct),
      st = stateOf(hero),
      first = !st.flags['visit_' + s.id];
    if (first) {
      st.flags['visit_' + s.id] = true;
      giveGear(clampLevel(hero.level), 'quest', 'Épique', hero);
      tell(hero, '🎁 Une offrande des anciens t’attendait sur l’autel.');
      window.CANAAN_PERSISTENCE.requestSave();
    }
    const lit = st.flags[s.star];
    return panel(
      hero,
      '🏛️ ' + s.name,
      s.lore +
        (lit ? ' L’autel brille : son étoile est revenue.' : ' L’autel est éteint, il attend son étoile.')
    );
  }
  // ---------------------------------------------------------------- Étape de simulation (hôte)
  function stepTrails(hero) {
    for (const [id, st] of Object.entries(stateOf(hero).active)) {
      const q = quest(Number(id));
      if (!q || st.step >= q.steps.length) continue;
      const step = q.steps[st.step],
        site = SITES[q.site],
        p = hero.player;
      if (!here(site)) continue;
      if (step.k === 'trail') {
        const end = q.id === 1 ? [px(site, 0), py(site, 0)] : site.trail.at(-1);
        if (Math.hypot(p.x - end[0], p.y - end[1]) < 2.4 * T) advance(hero, q);
      } else if (
        step.k === 'reach' &&
        Math.hypot(p.x - px(site, step.at[0]), p.y - py(site, step.at[1])) < 1.2 * T
      ) {
        if (q.id === 7)
          tell(
            hero,
            '🌳 L’arbre gardien parle : « Petite étincelle… Le Cœur de l’Aurore attend. Rassemble les six étoiles. »'
          );
        if (q.id === 15) cue(hero, 'chest');
        advance(hero, q);
      }
    }
  }
  window.CanaanStages.quests = {
    after() {
      if (!started || paused || game.world.instance || guest()) return;
      const t = now();
      if (t % 10 === 0) for (const hero of game.heroes) if (!hero.player.dead && !hero.away) stepTrails(hero);
      FIELD.step(SITES);
      stepMore();
      // La suite ne concerne que l'île.
      if (canaanUnder()) return;
      // Poisson doré : un remous brille d'or de temps en temps.
      const f = ST.q5;
      if (t >= f.next) {
        f.gold = Math.floor(Math.random() * 5);
        f.until = t + 110;
        f.next = t + 260 + Math.floor(Math.random() * 140);
        changed();
      }
      // Nénuphars : ils coulent après deux secondes sous un héros et remontent trois secondes plus tard.
      const site = SITES.q15;
      if (site) {
        ST.q15.pads.forEach((pad, i) => {
          if (pad.sunk) {
            if (t >= pad.sunk) {
              pad.sunk = 0;
              changed();
            }
            return;
          }
          const [dx, dy] = site.pads[i],
            on = game.heroes.some(
              h =>
                !h.player.dead &&
                Math.floor(h.player.x / T) === site.x + dx &&
                Math.floor(h.player.y / T) === site.y + dy
            );
          const before = Math.floor(pad.t * 4);
          pad.t = on ? pad.t + 1 / 60 : Math.max(0, pad.t - 1 / 120);
          if (pad.t >= 2) {
            pad.t = 0;
            pad.sunk = t + 180;
          }
          if (Math.floor(pad.t * 4) !== before || pad.sunk) changed();
        });
        // Un héros dans l'eau de l'étang : plouf, retour sur la rive.
        for (const h of game.heroes) {
          const p = h.player,
            tx = Math.floor(p.x / T) - site.x,
            ty = Math.floor(p.y / T) - site.y;
          if (p.dead || tx < -3 || tx > 5 || ty < -3 || ty > 3 || canWalk(p.x, p.y)) continue;
          p.x = px(site, site.start[0]);
          p.y = py(site, site.start[1]);
          float(p.x, p.y - 40, '💦 Plouf !', '#9fd8ff');
        }
      }
    }
  };

  // ---------------------------------------------------------------- Interaction (touche E)
  // Ce que le héros de ce joueur peut faire tout près : parler à un PNJ ou agir sur un objet.
  function nearest(hero = game.hero) {
    if (game.world.instance) return null;
    const p = hero.player;
    let best = null,
      bd = 1e9;
    for (const npc of Object.values(NPCS)) {
      if (!here(npc) || !present(hero, npc) || (npc.dwarf && !hasWords(hero, npc))) continue;
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < 1.8 * T && d < bd) [best, bd] = [{ npc }, d];
    }
    for (const site of Object.values(SITES)) {
      if (!here(site)) continue;
      for (const o of site.objs) {
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if (d < (o.range ?? 1.6) * T && d < bd && usable(hero, site, o)) [best, bd] = [{ site, o }, d];
      }
    }
    if (WAYSTONE.camp && !canaanUnder()) {
      const d = Math.hypot(p.x - WAYSTONE.camp.x, p.y - WAYSTONE.camp.y);
      if (d < 1.6 * T && d < bd)
        best = { site: null, o: { id: 'campstone', kind: 'campstone', ...WAYSTONE.camp } };
    }
    return best;
  }
  // Un objet ne se propose que s'il sert à ce héros (objets personnels cachés, sanctuaire fermé…).
  function usable(hero, site, o) {
    const q = site.quest,
      st = stateOf(hero);
    switch (o.kind) {
      case 'field':
        return FIELD.usable(hero, site, o);
      case 'mstone':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'dig':
      case 'viewpoint':
        return !!at(hero, q, 'spot') && Math.hypot(hero.player.x - o.x, hero.player.y - o.y) < 0.9 * T;
      case 'ripple':
        return !!at(hero, q, 'timing');
      case 'clue':
      case 'witness':
        return !!st.active[14] || !!st.done[14];
      case 'shrine':
        return !!qworld.flags['sanct_' + o.sanct];
      case 'door':
        return !qworld.flags['sanct_' + o.sanct];
      case 'crystal':
      case 'islechest':
      case 'machine':
      case 'plank':
      case 'oasis':
        return false;
      case 'leaf':
      case 'fresco':
      case 'ccrystal':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'goldleaf':
        return !!at(hero, q, 'catch');
      case 'echest':
        return !!at(hero, q, 'puzzle');
      case 'altar':
        return !!at(hero, q, 'spot') || !!st.done[26];
      case 'fresco27':
      case 'altar27':
        return true;
      case 'gseal':
        // Un seul gardien à la fois (chez l'invité, FIGHTS est vide : le boss présent suffit).
        return (
          guardianDue(hero, q) &&
          !FIGHTS[site.id] &&
          !game.world.monsters.some(m => m.boss && m.t === guardianOf(q).name)
        );
      case 'shell':
        return !st.shells.includes(o.shell);
    }
    return true;
  }
  function label(hero, n) {
    if (n.npc) return 'Parler à ' + n.npc.def.name;
    const o = n.o;
    if (o.kind === 'field') return FIELD.label(o);
    return (
      {
        dig: 'Creuser',
        ripple: 'Ferrer',
        mstone: 'Écouter la pierre',
        chime: 'Jouer la pierre',
        mirror: 'Tourner le miroir',
        waystone: 'Pierre de passage',
        campstone: 'Pierre de passage',
        viewpoint: 'Appeler Théon',
        clue: 'Examiner',
        witness: 'Interroger ' + (GHOST_CLUES.find(c => c.id === o.clue)?.who || ''),
        shrine: 'Prier à l’autel',
        door: 'Pousser la porte',
        leaf: 'Toucher la feuille',
        fresco: 'Prendre le fragment',
        archive: 'Lire les archives',
        vane: 'Regarder la girouette',
        goldleaf: 'Attraper la feuille',
        traveler: 'Écouter ' + (o.who || ''),
        hide: 'Fouiller : ' + (o.name || ''),
        treasure: 'Porte du trésor',
        templedoor: 'Porte du temple',
        altar: 'Poser les étoiles',
        fresco27: 'Lire la fresque',
        altar27: 'Éveiller le Cœur',
        ccrystal: 'Réunir la lumière',
        lever: 'Actionner le levier',
        echest: 'Ouvrir le coffre',
        gseal: 'Briser le sceau de l’Ombre',
        shell: 'Ramasser le coquillage'
      }[o.kind] || 'Agir'
    );
  }
  function interact() {
    const n = nearest();
    if (!n) return false;
    if (n.npc) {
      talkTo(n.npc.id);
      return true;
    }
    if (guest()) {
      CANAAN_NET.requestAction({ op: 'quest-act', site: n.site ? n.site.id : 'camp', obj: n.o.id });
      return true;
    }
    if (n.o.kind === 'campstone') travel(game.hero, 'forest');
    else act(game.hero, n.site, n.o);
    return true;
  }
  // Demandes d'un invité, vérifiées par l'hôte (distance, étape, objet existant).
  function handle(hero, a) {
    if (a.op === 'quest-accept') return accept(hero, a.q);
    if (a.op === 'quest-take') return take(hero, a.q);
    if (a.op === 'quest-abandon') return abandon(hero, a.q);
    if (a.op === 'quest-turnin') return turnIn(hero, a.q);
    if (a.op === 'quest-track') {
      const st = stateOf(hero);
      st.track = st.active[a.q] ? a.q : null;
      return true;
    }
    if (a.op === 'quest-choice') return choose(hero, a.q, a.choice);
    if (a.op === 'quest-talk') return hear(hero, a.q);
    if (a.op === 'quest-trade') return trade(hero, a.npc);
    if (a.op === 'quest-shells') return claimShells(hero);
    if (a.op === 'quest-act') {
      if (a.site === 'camp' && a.obj === 'campstone')
        return (
          WAYSTONE.camp &&
          Math.hypot(hero.player.x - WAYSTONE.camp.x, hero.player.y - WAYSTONE.camp.y) < 2 * T &&
          travel(hero, 'forest')
        );
      const site = SITES[a.site],
        o = site?.objs.find(o => o.id === a.obj);
      if (
        !o ||
        !here(site) ||
        Math.hypot(hero.player.x - o.x, hero.player.y - o.y) > ((o.range ?? 1.6) + 0.6) * T ||
        !usable(hero, site, o)
      )
        return false;
      return act(hero, site, o) !== false;
    }
    return false;
  }
  // Réponse ou choix moral : à une question (answer), une mauvaise réponse se retente ; sinon, chaque choix compte.
  function choose(hero, id, choice) {
    const q = quest(id),
      st = q && at(hero, q, 'choice'),
      npc = st && NPCS[q.steps[st.step].npc || q.npc];
    if (
      !st ||
      !npc ||
      !here(npc) ||
      Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T ||
      !Number.isInteger(choice) ||
      !q.choices[choice]
    )
      return false;
    if (q.answer !== undefined && choice !== q.answer) {
      tell(hero, '👻 « Non… ce n’est pas ça. Je crois que non. »');
      return true;
    }
    stateOf(hero).choices[q.id] = choice;
    return advance(hero, q);
  }
  // Étape « parler à quelqu'un » : ses répliques sont lues.
  function hear(hero, id) {
    const q = quest(id),
      st = q && at(hero, q, 'talk'),
      npc = st && NPCS[q.steps[st.step].npc];
    if (!npc || !here(npc) || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    return advance(hero, q);
  }
  // Étape en cours qui se passe avec ce personnage (parler, choisir) : { q, step }, ou null.
  function errand(hero, npc) {
    for (const id of Object.keys(stateOf(hero).active)) {
      const q = quest(Number(id)),
        step = q?.steps[stateOf(hero).active[id].step];
      if ((step?.k === 'talk' || step?.k === 'choice') && (step.npc || q.npc) === npc.id) return { q, step };
    }
    return null;
  }
  // Un nain de la forteresse garde ses répliques ordinaires quand il n'a rien à dire d'une quête.
  const hasWords = (hero, npc) =>
    !!errand(hero, npc) || ['offer', 'active', 'ready'].includes(npcState(hero, npc.quest));
  // Personnage visible seulement à une étape précise (Vesper).
  const present = (hero, npc) => {
    const w = npc.def.when;
    return !w || stateOf(hero).active[w.quest]?.step === w.step;
  };

  // Cible de la quête suivie : le PNJ s'il faut y retourner, sinon le lieu ou l'objet de l'étape.
  function target(hero) {
    const st = stateOf(hero),
      q = quest(st.track);
    if (!q || !st.active[q.id]) return null;
    const a = st.active[q.id],
      step = q.steps[a.step];
    // Avis de la guilde : il se rend à la guilde ; ses objectifs se font n'importe où.
    if (q.npc === 'guilde' && !step) {
      const door = CANAAN_GUILD.door();
      return door && { ...door, text: 'Retourne voir ' + whoTo(q), q };
    }
    const site = SITES[step?.site || q.site];
    // Créatures à vaincre n'importe où : à la surface, l'habitat le plus proche de l'espèce demandée (ou, pour un
    // contrat de la guilde, d'une créature à la mesure du héros), mob-lairs.js.
    if (!site && step && (step.k === 'kill' || step.k === 'loot') && !step.boss && !canaanUnder()) {
      const p = hero.player,
        lair = CANAAN_LAIRS.nearest(p.x / T, p.y / T, step.mobs, hero);
      if (lair)
        return {
          x: (lair.x + 0.5) * T,
          y: (lair.y + 0.5) * T,
          text: step.text + ' — ' + lair.name,
          count: FIELD.progress(step, a),
          q,
          area: CANAAN_LAIRS.inside(lair, p.x / T, p.y / T),
          vague: true
        };
    }
    if (!site)
      return step
        ? {
            x: hero.player.x,
            y: hero.player.y,
            text: step.text,
            count: FIELD.progress(step, a),
            q,
            anywhere: true
          }
        : null;
    // Personnage à voir : celui de la quête à rendre, ou celui de l'étape.
    const who = !step ? q.npc : step.k === 'talk' || step.k === 'choice' ? step.npc || q.npc : null,
      npc = who && NPCS[who],
      text = step ? step.text : 'Retourne voir ' + whoTo(q),
      count = step ? FIELD.progress(step, a) : null,
      under = npc ? !!npc.under : !!site.under;
    // L'objectif est sur l'autre couche : l'entrée des Tréfonds la plus proche.
    if (step?.k !== 'sky' && step?.k !== 'work' && under !== canaanUnder()) {
      const p = hero.player,
        e = [...CANAAN_UNDER.ENTRANCES].sort(
          (u, v) => Math.hypot(u.x * T - p.x, u.y * T - p.y) - Math.hypot(v.x * T - p.x, v.y * T - p.y)
        )[0];
      return {
        x: (e.x + 0.5) * T,
        y: (e.y + 0.5) * T,
        text: under ? 'Descendre dans les Tréfonds' : 'Remonter à la surface',
        q
      };
    }
    if (npc) return { x: npc.x, y: npc.y, text, q };
    const spot = FIELD.target(hero, site, q, step, a);
    if (spot) return { ...spot, text: spot.lair ? text + ' — ' + spot.lair.name : text, count, q };
    if (step.k === 'guardian') {
      const seal = site.objs.find(o => o.kind === 'gseal');
      if (seal) return { x: seal.x, y: seal.y, text, q };
    }
    if (step.k === 'collect') {
      const left = site.objs.find(
        o => ['mstone', 'leaf', 'fresco', 'ccrystal'].includes(o.kind) && !a.got.includes(o.id)
      );
      if (left) return { x: left.x, y: left.y, text: step.text, count, q, vague: true };
    }
    if (step.at)
      return {
        x: px(site, step.at[0]),
        y: py(site, step.at[1]),
        text: step.text,
        q,
        vague: step.k === 'spot'
      };
    if (step.k === 'catch') return { x: site.leaf.x, y: site.leaf.y, text: step.text, q };
    if (step.k === 'defense') {
      const altar = site.objs.find(o => o.kind === 'altar27');
      return { x: altar.x, y: altar.y, text: step.text, q };
    }
    if (step.k === 'search' || step.k === 'clues')
      return { x: px(site, 0), y: py(site, 0), text: step.text, q, vague: true };
    return { x: px(site, 0), y: py(site, 0), text: step.text, q };
  }
  // Aucune quête suivie : le prochain personnage qui a une quête à donner (« ! »). D'abord l'histoire principale à
  // portée du niveau du héros, puis la quête secondaire la plus proche sur la même couche (au plus trois niveaux
  // au-dessus du héros), et à défaut la suite de l'histoire, même plus haute.
  function nextOffer(hero) {
    const level = clampLevel(hero.level),
      p = hero.player,
      under = canaanUnder(),
      fits = q => q.scaled || q.level <= level + 3,
      dist = n => Math.hypot(n.x - p.x, n.y - p.y);
    const offers = Object.values(NPCS).filter(
      n => n.quest && !n.def.collector && present(hero, n) && npcState(hero, n.quest) === 'offer'
    );
    if (!offers.length) return guildOffer(hero);
    const near = offers.filter(n => !!n.under === under).sort((a, b) => dist(a) - dist(b)),
      main = offers.filter(n => n.quest.main && !n.under).sort((a, b) => a.quest.id - b.quest.id)[0],
      pick =
        (main && fits(main.quest) && main) ||
        near.find(n => n.quest.main && fits(n.quest)) ||
        near.find(n => fits(n.quest)) ||
        main;
    if (!pick) return null;
    // La suite de l'histoire est trop haute : un contrat de la guilde d'abord, s'il n'y en a pas en cours.
    if (!fits(pick.quest) && !activeContract(stateOf(hero)) && !under) {
      const g = guildOffer(hero);
      if (g) return g;
    }
    const q = pick.quest,
      text = tt('Parler à {nom} pour une nouvelle quête', { nom: pick.def.name });
    if (!!pick.under !== under) {
      const e = [...CANAAN_UNDER.ENTRANCES].sort(
        (u, v) => Math.hypot(u.x * T - p.x, u.y * T - p.y) - Math.hypot(v.x * T - p.x, v.y * T - p.y)
      )[0];
      return { x: (e.x + 0.5) * T, y: (e.y + 0.5) * T, text: 'Remonter à la surface', q, offer: true };
    }
    return { x: pick.x, y: pick.y, text, q, offer: true, high: !fits(q) };
  }
  // Le tableau de la guilde, quand le héros n'a pas de contrat en cours (à la surface).
  function guildOffer(hero) {
    if (canaanUnder() || activeContract(stateOf(hero))) return null;
    const door = CANAAN_GUILD.door();
    return (
      door && {
        ...door,
        text: 'Choisir un contrat au tableau de la guilde',
        q: GUILD_BOARD_QUEST,
        offer: true
      }
    );
  }
  // Pseudo-quête affichée par le suivi pour le tableau de la guilde.
  const GUILD_BOARD_QUEST = Object.freeze({ id: 0, title: GUILD_NAME, contract: 'F', main: false });
  const trackerEl = document.createElement('div');
  trackerEl.id = 'questTracker';
  trackerEl.hidden = true;
  document.body.appendChild(trackerEl);
  // Objectif montré par le suivi : Lumi vole de ce côté.
  let guideTo = null;
  function tracker() {
    const tr =
      started && !game.world.instance
        ? target(game.hero) || nextOffer(game.hero) || shellTarget(game.hero)
        : null;
    guideTo = tr;
    trackerEl.hidden = !tr;
    if (!tr) return;
    const d = Math.round(Math.hypot(tr.x - P.x, tr.y - P.y) / T),
      a = Math.atan2(tr.y - P.y, tr.x - P.x),
      html =
        (tr.offer
          ? '<small>' +
            (tr.high
              ? 'Suite de l’histoire'
              : tr.q === GUILD_BOARD_QUEST
                ? 'Nouveau contrat'
                : 'Nouvelle quête') +
            '</small>'
          : '') +
        '<b>' +
        (tr.q.main ? '📖 ' : isContract(tr.q) ? '🛡️ ' : '🍃 ') +
        esc(tr.q.title) +
        (tr.high ? ' <small>(' + tt('niveau {n}', { n: tr.q.level }) + ')</small>' : '') +
        '</b><span>' +
        esc(tr.text) +
        '</span>' +
        (tr.count ? '<b class="quest-count">' + tr.count[0] + ' / ' + tr.count[1] + '</b>' : '') +
        '<em>' +
        (tr.anywhere
          ? 'Partout sur l’île'
          : tr.area
            ? 'Par ici'
            : d <= 2
              ? 'Tu y es'
              : '<i style="transform:rotate(' +
                a.toFixed(2) +
                'rad)">➤</i> ' +
                (tr.vague && d < 8 ? 'tout près' : d + ' cases')) +
        '</em>';
    if (trackerEl.innerHTML !== html) trackerEl.innerHTML = html;
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  function exportWorld() {
    return { flags: { ...qworld.flags }, solved: { ...qworld.solved } };
  }
  function importWorld(d) {
    qworld = { flags: {}, solved: {} };
    if (d && typeof d === 'object') {
      for (const f of WORLD_FLAGS) if (d.flags?.[f]) qworld.flags[f] = true;
      for (const id of Object.keys(SITES)) if (d.solved?.[id]) qworld.solved[id] = true;
      // Anciennes énigmes résolues : le lieu garde son changement.
      for (const [id, f] of Object.entries(LEGACY_SOLVED)) if (d.solved?.[id]) qworld.flags[f] = true;
    }
    ST = puzzleFreshStates();
    FIELD.reset();
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
    for (const id of Object.keys(qworld.solved)) {
      const solved = puzzleSolvedState(id);
      if (solved) Object.assign(ST[id], solved);
    }
    changed();
  }
  // État des lieux envoyé aux invités quand il change (et de temps en temps pour un invité qui arrive).
  let sent = -1,
    sentAt = -1e9;
  function netView() {
    if (version === sent && time - sentAt < 300) return undefined;
    sent = version;
    sentAt = time;
    return {
      w: exportWorld(),
      s: {
        f: FIELD.netView(),
        q5: [ST.q5.gold, Math.max(0, ST.q5.until - time)],
        q6: ST.q6.seq.length,
        q15: ST.q15.pads.map(p => [Math.round(p.t * 4) / 4, p.sunk ? 1 : 0]),
        q18: ST.q18.t,
        q24: ST.q24.m,
        q27: [ST.q27.on ? 1 : 0, ST.q27.hp.map(Math.round)],
        q28: ST.q28.l,
        q30: ST.q30.seq
      }
    };
  }
  const ints = (a, n, max) =>
    Array.isArray(a) && a.length === n && a.every(v => Number.isInteger(v) && v >= 0 && v <= max)
      ? [...a]
      : null;
  function applyRemote(v) {
    if (!v || typeof v !== 'object') return;
    if (v.w) {
      const before = JSON.stringify(qworld.solved);
      qworld = { flags: {}, solved: {} };
      for (const f of Object.keys(v.w.flags || {})) if (/^[a-z_]{2,24}$/.test(f)) qworld.flags[f] = true;
      for (const id of Object.keys(v.w.solved || {})) if (SITES[id]) qworld.solved[id] = true;
      if (before !== JSON.stringify(qworld.solved))
        for (const id of Object.keys(qworld.solved)) {
          const solved = puzzleSolvedState(id);
          if (solved) Object.assign(ST[id], solved);
        }
    }
    const s = v.s;
    if (!s) return;
    FIELD.applyRemote(s.f, SITES);
    if (Array.isArray(s.q5)) {
      ST.q5.gold = Number.isInteger(s.q5[0]) ? s.q5[0] : -1;
      ST.q5.until = time + (Number(s.q5[1]) || 0);
    }
    if (Number.isInteger(s.q6)) ST.q6.seq = [1, 4, 2, 3].slice(0, Math.min(4, s.q6));
    ST.q24.m = ints(s.q24, 4, 3) || ST.q24.m;
    ST.q28.l = ints(s.q28, 3, 1) || ST.q28.l;
    if (Number.isFinite(s.q18)) ST.q18.t = s.q18;
    if (Number.isInteger(s.q30)) ST.q30.seq = Math.max(0, Math.min(CONSTELLATION.length, s.q30));
    if (Array.isArray(s.q27)) {
      ST.q27.on = !!s.q27[0];
      if (Array.isArray(s.q27[1]) && s.q27[1].length === 6)
        ST.q27.hp = s.q27[1].map(v => Math.max(0, Math.min(100, Number(v) || 0)));
    }
    if (Array.isArray(s.q15))
      s.q15.forEach(
        (p, i) =>
          ST.q15.pads[i] &&
          Array.isArray(p) &&
          Object.assign(ST.q15.pads[i], { t: Number(p[0]) || 0, sunk: p[1] ? 1 : 0 })
      );
  }
  // Apparence visible chez les autres : Lumi (1), bénédiction des racines d'or (2), aura (4) et Écho (8).
  const questLook = hero =>
    (stateOf(hero).flags.lumi ? 1 : 0) |
    (stateOf(hero).flags.blessing ? 2 : 0) |
    (stateOf(hero).flags.aurora ? 4 : 0) |
    (stateOf(hero).flags.echo ? 8 : 0);

  // Lieux posés sur l'île ; une île régénérée (même graine) les reçoit à nouveau, à l'identique.
  function rebuild() {
    for (const site of surfaceSites()) delete SITES[site.id];
    for (const k of Object.keys(NPCS)) if (!NPCS[k].under) delete NPCS[k];
    FIELD.reset();
    WALK.clear();
    place();
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
  }
  // ---------------------------------------------------------------- Dialogues et journal (scripts/quests/dialogs.js)
  const { npcState, talkTo, card, toggleJournal, renderJournal } = CANAAN_QUEST_DIALOGS.create({
    state: LIVE,
    SITES,
    NPCS,
    guest,
    esc,
    stateOf,
    tradeAt,
    trade,
    hasLoupe,
    claimShells,
    quest,
    accept,
    whoTo,
    turnIn,
    choose,
    hear,
    errand
  });
  // ---------------------------------------------------------------- Dessin (scripts/quests/render.js)
  const { art, drawWorld, drawBubbles } = CANAAN_QUEST_RENDER.create({
    state: LIVE,
    T,
    SITES,
    NPCS,
    now,
    guest,
    stateOf,
    px,
    py,
    here,
    WAYSTONE,
    CONSTELLATION,
    beamOf,
    leafAt,
    FIGHTS,
    zones,
    heartFlag,
    guardianOf,
    guardianDue,
    tradeAt,
    hasLoupe,
    watchFanfare,
    stepOf,
    at,
    nearest,
    usable,
    label,
    errand,
    present,
    npcState,
    tracker
  });
  // Objectifs de terrain (quest-field.js), avec ce dont ils ont besoin d'ici.
  const FIELD = canaanQuestField({
    px,
    py,
    stateOf,
    advance,
    tell,
    cue,
    panel,
    changed,
    addObj,
    heroesNear,
    art
  });
  place();
  canaanQuestWorld = rebuild;
  window.CANAAN_QUESTS = Object.freeze({
    sites: () => SITES,
    placeUnder,
    field: () => FIELD,
    // Événement du jeu (victoire, pêche, récolte, donjon terminé), posé par canaanAchieve.
    event: (hero, type, a) => FIELD.event(hero, type, a),
    hear: (hero, id) => hear(hero, id),
    errand: (hero, npc) => !!errand(hero, npc),
    present,
    npcs: () => NPCS,
    // Personnage à montrer sur la carte : 'offer' (!), 'ready' (?), sur la couche du groupe.
    npcMode: (hero, npc) =>
      !here(npc) || !present(hero, npc)
        ? 'none'
        : errand(hero, npc)
          ? 'ready'
          : npc.quest
            ? npcState(hero, npc.quest)
            : 'none',
    waystones: () => Object.values(WAYSTONE).filter(Boolean),
    state: stateOf,
    world: () => qworld,
    puzzles: () => ST,
    accept,
    turnIn,
    take,
    abandon,
    advance,
    act: (hero, siteId, objId) => {
      const site = SITES[siteId],
        o = site?.objs.find(o => o.id === objId);
      return o ? act(hero, site, o) : false;
    },
    handle,
    interact,
    nearest,
    beam: () => beamOf(SITES.q24),
    exportWorld,
    importWorld,
    netView,
    applyRemote,
    questLook,
    done: (hero, id) => !!stateOf(hero).done[id],
    trade,
    claimShells,
    guardianDue,
    fights: () => FIGHTS,
    drawWorld,
    drawBubbles,
    render: renderJournal,
    card: (q, st) => card(q, st),
    target,
    // Prochaine quête à prendre quand aucune n'est suivie (suivi, conseils de Lumi).
    nextOffer
  });
  Object.assign(window, { toggleJournal });
})();
