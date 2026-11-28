// Objectifs de terrain des quêtes (« Les Échos de l'Aurore » et l'Interlude des Tréfonds) : chasse (kill), objets lâchés
// par les créatures (loot), objets du lieu à ramasser, allumer ou libérer (pick), défense par vagues (wave), escorte
// (escort), fuyards à rattraper (chase), course chronométrée (race), champion nommé (hunt), parler à quelqu'un (talk),
// métiers (work), donjon à terminer (clear), revoir le ciel (sky). Les étapes sont décrites dans shared/data/quests.js et
// quests-interlude.js ; scripts/quests/quests.js fournit les lieux, la progression et le dessin (kit de
// scripts/quests/render.js) et appelle ce module.
// - L'hôte décide de tout. Chacun garde sa progression ; un combat, une escorte ou une défense compte pour chaque héros
//   debout à proximité qui en est à cette étape.
// - Une épreuve en cours (vagues, escorte, fuyard, champion) est un « run », par quête et étape, jamais sauvegardé :
//   perdue ou abandonnée, elle se retente depuis le lieu. Les invités en reçoivent la vue (netView).
(() => {
  'use strict';
  const T = TS;
  // Distance (px) à laquelle un héros participe, et au-delà de laquelle une épreuve est abandonnée.
  const CLOSE = 16 * T,
    LOST = 22 * T;
  // Un champion a un peu plus de PV qu'une élite de son niveau.
  const CHAMPION_HP = 1.6;
  const ESCORT_SPEED = 1.75,
    CHASE_SPEED = 3.3;
  const LOOT_CHANCE = 0.65;
  // Décor propre au lieu, dessiné même sans la quête (éteint tant que le héros n'y a rien fait).
  const STATIC = new Set([
    'lantern',
    'frame',
    'house',
    'gear',
    'obelisk',
    'lever',
    'voice',
    'grave',
    'pillar',
    'bell',
    'horn',
    'candle',
    'barrel'
  ]);

  window.canaanQuestField = kit => {
    const { px, py, stateOf, advance, tell, cue, changed, addObj, heroesNear } = kit;
    const { R, glow, block, rune, shadowAt, crystalArt, flagArt, torchFlame, personArt, chestArt, PAL, OUT } =
      kit.art;
    const RUNS = new Map();
    // Chronomètre des courses, chez l'hôte : héros → { key, until }.
    const RACES = new WeakMap();
    // Objets lâchés : coups sans rien trouver, pour ne jamais être trop malchanceux.
    const DRY = new WeakMap();
    const keyOf = o => o.quest.id + '_' + o.step;
    const stepOf = o => o.quest.steps[o.step];
    const activeAt = (hero, o) => {
      const a = stateOf(hero).active[o.quest.id];
      return a && a.step === o.step ? a : null;
    };
    const passed = (hero, o) => {
      const st = stateOf(hero),
        a = st.active[o.quest.id];
      return !!st.done[o.quest.id] || (!!a && a.step > o.step);
    };
    const currentStep = (hero, q) => {
      const a = stateOf(hero).active[q.id];
      return a && a.step < q.steps.length ? q.steps[a.step] : null;
    };
    // Niveau des ennemis d'un lieu : celui de sa zone (bornée), ou celui du héros dans les Tréfonds.
    // Contrat de la guilde (toujours au niveau du héros) : jamais plus faibles que le héros le plus fort présent.
    const levelAt = (site, q) =>
      site.under
        ? clampLevel(game.hero.level)
        : q?.scaled
          ? Math.max(
              canaanZoneMobLevel(site.x, site.y),
              ...heroesNear(px(site, 0), py(site, 0), LOST).map(h => clampLevel(h.level))
            )
          : canaanZoneMobLevel(site.x, site.y);

    // ---------------------------------------------------------------- Placement
    // Objets des étapes qui se passent dans ce lieu. ok(x, y) : case où l'on peut poser quelque chose ; cavern(b, kind) :
    // centre d'une caverne des Tréfonds.
    function build(site, { ok, cavern }) {
      const spot = (dx, dy, gap = 1.3) => {
        for (let r = 0; r <= 7; r++) {
          let best = null,
            bd = 1e9;
          for (let y = -r; y <= r; y++)
            for (let x = -r; x <= r; x++) {
              if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
              const tx = dx + x,
                ty = dy + y,
                d = Math.hypot(x, y);
              if (d >= bd || !ok(site.x + tx, site.y + ty)) continue;
              if (
                site.objs.some(
                  o => o.kind !== 'lake' && o.kind !== 'machine' && Math.hypot(o.dx - tx, o.dy - ty) < gap
                )
              )
                continue;
              best = [tx, ty];
              bd = d;
            }
          if (best) return best;
        }
        return [dx, dy];
      };
      // Points autour du lieu, les mêmes chez chacun.
      const ring = (q, i, n, [min, max]) =>
        Array.from({ length: n }, (_, k) => {
          const h = ((q.id * 73 + i * 31 + k * 17) % 97) / 97,
            a = ((k + h * 0.6) / n) * Math.PI * 2 + q.id,
            d = min + (((q.id * 37 + k * 53 + i * 11) % 89) / 89) * (max - min);
          return [Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d)];
        });
      for (const q of QUESTS)
        q.steps.forEach((s, i) => {
          if ((s.site || q.site) !== site.id) return;
          const add = (name, dx, dy, extra = {}) =>
            addObj(site, 'f' + q.id + '_' + i + '_' + name, 'field', dx, dy, {
              quest: q,
              step: i,
              k: s.k,
              art: s.art,
              range: 1.4,
              ...extra
            });
          if (s.k === 'pick') {
            const pts = s.caverns
              ? s.caverns.map(([b, kind]) => {
                  const c = cavern(b, kind);
                  return [Math.round(c.x) - site.x, Math.round(c.y) - site.y];
                })
              : s.at || ring(q, i, s.n, s.spread);
            pts.forEach(([dx, dy], n) => add(n, ...(s.at ? [dx, dy] : spot(dx, dy, 1.6)), { i: n }));
          } else if (s.k === 'race') {
            const pts = ring(q, i, s.n, s.spread).map(([dx, dy]) => spot(dx, dy, 2));
            add('go', ...spot(0, 1), { race: 'go' });
            pts.forEach(([dx, dy], n) => add(n, dx, dy, { race: n }));
            // Temps : la longueur du parcours à la vitesse du héros, avec de la marge pour les détours.
            let len = 0,
              [lx, ly] = [0, 1];
            for (const [dx, dy] of pts) {
              len += Math.hypot(dx - lx, dy - ly);
              [lx, ly] = [dx, dy];
            }
            site.raceTime ??= {};
            site.raceTime[q.id + '_' + i] = Math.ceil(((len * T) / (CANAAN_PLAYER_SPEED * 60)) * 1.9 + 5);
          } else if (s.k === 'escort') {
            const from = spot(...s.from, 1);
            add('go', ...from, { end: spot(...s.to, 0) });
          } else if (s.k === 'wave' || s.k === 'hunt') add('go', ...spot(...(s.at || [0, 1]), 1));
          else if (s.k === 'chase') add('go', ...spot(...(s.at || [0, 0]), 1), { range: 1.3 });
        });
    }

    // ---------------------------------------------------------------- Progression
    function bump(hero, q, icon, label) {
      const a = stateOf(hero).active[q.id],
        s = currentStep(hero, q);
      if (!a || !s) return false;
      a.n = (a.n || 0) + 1;
      if (a.n >= (s.n || 1)) return advance(hero, q);
      tell(hero, icon + ' ' + label + ' · ' + a.n + ' / ' + s.n);
      return true;
    }
    // Chaque héros debout à proximité qui en est à cette étape.
    const partners = (o, x, y, r = CLOSE) => heroesNear(x, y, r).filter(h => activeAt(h, o));
    // Événements du jeu (canaanAchieve) : victoires, pêche, récolte, donjon terminé.
    function event(hero, type, a) {
      if (type === 'kill' && a && !game.world.instance) {
        const near = heroesNear(a.x, a.y, CLOSE);
        if (!near.includes(hero)) near.push(hero);
        for (const h of near)
          for (const id of Object.keys(stateOf(h).active)) {
            const q = questById(Number(id)),
              s = q && currentStep(h, q);
            if (!s || !mobFits(h, s, a)) continue;
            if (s.k === 'kill') bump(h, q, '⚔️', s.what);
            else if (s.k === 'loot') {
              const dry = DRY.get(h) || 0,
                chance = s.chance || LOOT_CHANCE;
              if (Math.random() < chance || dry >= Math.ceil(2 / chance)) {
                DRY.set(h, 0);
                float(a.x, a.y - 60, s.icon, '#ffe9a0');
                bump(h, q, s.icon, s.item);
              } else DRY.set(h, dry + 1);
            }
          }
        return;
      }
      const job = type === 'fish' ? 'fish' : type === 'gather' ? a : type === 'cook' ? 'cook' : null;
      for (const id of Object.keys(stateOf(hero).active)) {
        const q = questById(Number(id)),
          s = q && currentStep(hero, q);
        if (!s) continue;
        if (s.k === 'work' && job === s.job)
          bump(
            hero,
            q,
            job === 'fish' ? '🎣' : job === 'ore' ? '⛏️' : job === 'cook' ? '🍳' : '🌿',
            job === 'cook' ? 'Repas' : 'Récolte'
          );
        else if (s.k === 'clear' && type === 'clear' && instanceFits(hero, s, a))
          bump(hero, q, '🏰', 'Donjon');
      }
    }
    // Créature qui compte pour une étape : celles qu'elle nomme, ou (mobs: '*', contrats de la guilde) une créature de
    // l'île à la mesure du héros : au plus 5 niveaux de moins (10 pour un boss mondial), élite ou boss si demandé.
    function mobFits(hero, s, m) {
      if (s.mobs !== '*') return !!s.mobs?.includes(m.t);
      if (s.boss) return !!m.worldBoss && (m.level || 1) >= clampLevel(hero.level) - 10;
      if (s.elite && !m.elite) return false;
      return !m.worldBoss && (m.level || 1) >= clampLevel(hero.level) - 5;
    }
    // Donjon terminé qui compte : celui que l'étape nomme, ou (instance: '*') un donjon à la mesure du héros (au plus
    // 6 niveaux de moins, ou un donjon des Tréfonds, toujours à son niveau) ; raid ou Tréfonds si demandé.
    function instanceFits(hero, s, index) {
      if (s.instance !== '*') return index === s.instance;
      const d = instances[index];
      if (!d || d.arena || (s.raid && !d.raid) || (s.under && !d.under)) return false;
      if (d.scaled) return true;
      const level = game.world.instance?.scaledLevel || instanceDifficulty()?.mobLevel || d.mobLevel || 1;
      return level >= clampLevel(hero.level) - 6;
    }

    // ---------------------------------------------------------------- Ennemis
    // extra.quest : quête de l'épreuve (pour le niveau des ennemis) ; le reste est copié sur le monstre.
    /**
     * @param {any} site
     * @param {string} name
     * @param {number} x
     * @param {number} y
     * @param {Record<string, any>} [options]
     */
    function spawnFoe(site, name, x, y, { quest, ...extra } = {}) {
      const type = canaanMobTypes().find(t => t.name === name) || MOB_TYPES[0],
        level = levelAt(site, quest),
        elite = !!extra.elite,
        hp = Math.round(mobHealth(level, elite, type.hp) * (extra.title ? CHAMPION_HP : 1)),
        m = {
          x,
          y,
          hp,
          mhp: hp,
          level,
          t: type.name,
          r: elite ? 19 : 16,
          cd: 1,
          g: mobGold(level, elite),
          mobColor: type.color,
          elite,
          under: !!site.under,
          _levelHp: true,
          ...extra
        };
      game.world.monsters.push(m);
      burst(x, y, type.color, 14);
      return m;
    }
    // n ennemis en cercle autour d'un point, sur des cases praticables.
    function spawnRing(site, names, n, x, y, r, extra) {
      const out = [];
      for (let k = 0; k < n; k++) {
        let fx = x,
          fy = y;
        for (let tries = 0; tries < 10; tries++) {
          const a = (k / n) * Math.PI * 2 + tries * 0.7 + Math.random() * 0.4,
            d = r * (1 - tries * 0.07);
          fx = x + Math.cos(a) * d;
          fy = y + Math.sin(a) * d;
          if (canWalk(fx, fy) && !isSafe(fx / T, fy / T)) break;
        }
        out.push(spawnFoe(site, names[k % names.length], fx, fy, extra));
      }
      return out;
    }
    const foesOf = key => game.world.monsters.filter(m => m.questRun === key && m.hp > 0);
    const dismiss = key => {
      game.world.monsters = game.world.monsters.filter(m => m.questRun !== key);
    };
    // Les ennemis d'une épreuve s'en prennent à ce qu'on protège, sauf si un héros est tout près d'eux. Renvoie les
    // dégâts de ce pas.
    function gnaw(foes, x, y, power) {
      let hurt = 0;
      for (const m of foes) {
        if (game.heroes.some(h => !h.player.dead && Math.hypot(h.player.x - m.x, h.player.y - m.y) < 2.5 * T))
          continue;
        const d = Math.hypot(x - m.x, y - m.y);
        if (d > 1.1 * T) {
          const nx = m.x + ((x - m.x) / d) * 1.1,
            ny = m.y + ((y - m.y) / d) * 1.1;
          if (canWalk(nx, ny, true)) [m.x, m.y] = [nx, ny];
        } else hurt += power;
      }
      return hurt;
    }

    // ---------------------------------------------------------------- Actions (touche E)
    function usable(hero, site, o) {
      const a = activeAt(hero, o);
      if (!a) return false;
      const run = RUNS.get(keyOf(o));
      switch (o.k) {
        case 'pick':
          return !a.got.includes(o.id);
        case 'race':
          return o.race === 'go' && !a.n;
        case 'chase':
          return Math.hypot(hero.player.x - o.x, hero.player.y - o.y) < 1.3 * T;
        default:
          return !run;
      }
    }
    function label(o) {
      const s = stepOf(o);
      return s.label || (o.k === 'race' ? 'Prendre le départ' : 'Agir');
    }
    function act(hero, site, o) {
      if (!usable(hero, site, o)) return false;
      const q = o.quest,
        s = stepOf(o),
        a = activeAt(hero, o),
        key = keyOf(o);
      if (o.k === 'pick') {
        a.got.push(o.id);
        burst(o.x, o.y - 10, '#ffe9a0', 16);
        cue(hero, s.art === 'miner' ? 'puzzle' : 'note' + (((a.got.length - 1) % 4) + 1));
        tell(hero, s.icon + ' ' + s.item + ' · ' + a.got.length + ' / ' + s.n);
        if (s.ambush) {
          spawnRing(site, [s.ambush[0]], s.ambush[1], o.x, o.y, 2.6 * T, { quest: q });
          float(o.x, o.y - 60, '⚠️ Embuscade !', '#ff8a6a');
        }
        if (a.got.length >= s.n) advance(hero, q);
        if (s.panels) kit.panel(hero, s.icon + ' ' + s.item, s.panels[o.i]);
        return true;
      }
      if (o.k === 'race') {
        const secs = site.raceTime[key];
        a.got = [];
        a.n = secs;
        RACES.set(hero, { key, until: time + secs * 60 });
        tell(hero, '🏁 Partez !');
        cue(hero, 'note4');
        return true;
      }
      if (o.k === 'chase') {
        const run = RUNS.get(key);
        burst(o.x, o.y, '#ffe9a0', 22);
        for (const h of new Set([hero, ...partners(o, o.x, o.y, 8 * T)])) bump(h, q, '🐾', s.who);
        if (run) home(run, 1 + Math.floor(Math.random() * 5));
        changed();
        return true;
      }
      if (o.k === 'hunt') {
        const m = spawnFoe(site, s.mob, o.x, o.y - T * 0.5, {
          elite: true,
          title: s.title,
          questRun: key,
          quest: q
        });
        if (s.adds) spawnRing(site, [s.adds[0]], s.adds[1], o.x, o.y, 2.6 * T, { questRun: key, quest: q });
        RUNS.set(key, { k: 'hunt', o, site, m, x: o.x, y: o.y });
        burst(o.x, o.y, '#ff6a3a', 34);
        for (const h of partners(o, o.x, o.y)) {
          tell(h, '⚔️ ' + s.title);
          cue(h, 'wrong');
        }
        changed();
        return true;
      }
      if (o.k === 'wave') {
        RUNS.set(key, { k: 'wave', o, site, x: o.x, y: o.y, hp: 100, wave: 0, next: time + 100 });
        for (const h of partners(o, o.x, o.y)) tell(h, '🛡️ Défends ' + s.what + ' !');
        changed();
        return true;
      }
      if (o.k === 'escort') {
        RUNS.set(key, {
          k: 'escort',
          o,
          site,
          x: o.x,
          y: o.y,
          hp: 100,
          at: 0,
          sprung: 0,
          path: route(o.x, o.y, px(site, o.end[0]), py(site, o.end[1]))
        });
        for (const h of partners(o, o.x, o.y)) tell(h, '🐾 ' + s.who + ' te suit. Reste à ses côtés !');
        changed();
        return true;
      }
      return false;
    }
    // Chemin à pied (largeur d'abord, cases praticables) : points du départ à l'arrivée ; tout droit s'il n'y en a pas.
    function route(x0, y0, x1, y1) {
      const sx = Math.floor(x0 / T),
        sy = Math.floor(y0 / T),
        ex = Math.floor(x1 / T),
        ey = Math.floor(y1 / T),
        free = (x, y) => canWalk((x + 0.5) * T, (y + 0.5) * T),
        id = (x, y) => y * MAPW + x,
        prev = new Map([[id(sx, sy), -1]]),
        queue = [[sx, sy]];
      for (let h = 0; h < queue.length && h < 4000; h++) {
        const [x, y] = queue[h];
        if (x === ex && y === ey) break;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const nx = x + dx,
            ny = y + dy;
          if (Math.abs(nx - sx) > 34 || Math.abs(ny - sy) > 34 || prev.has(id(nx, ny))) continue;
          if (!free(nx, ny) && !(nx === ex && ny === ey)) continue;
          prev.set(id(nx, ny), id(x, y));
          queue.push([nx, ny]);
        }
      }
      if (!prev.has(id(ex, ey)))
        return [
          [x0, y0],
          [x1, y1]
        ];
      const out = [];
      for (let k = id(ex, ey); k !== -1; k = prev.get(k))
        out.unshift([((k % MAPW) + 0.5) * T, (Math.floor(k / MAPW) + 0.5) * T]);
      return out;
    }
    // Un fuyard repart de chez lui, ou d'un peu plus loin.
    function home(run, n = 0) {
      const { o } = run;
      for (let tries = 0; tries < 12; tries++) {
        const a = n * 1.9 + tries * 0.8,
          d = n ? (3 + (tries % 3)) * T : 0,
          x = run.hx + Math.cos(a) * d,
          y = run.hy + Math.sin(a) * d;
        if (!canWalk(x, y)) continue;
        Object.assign(run, { x, y, tired: 0, breath: 240 });
        break;
      }
      Object.assign(o, { x: run.x, y: run.y });
    }

    // ---------------------------------------------------------------- Étape de simulation (hôte)
    function finish(key, run, win, text) {
      RUNS.delete(key);
      dismiss(key);
      const r = run.k === 'escort' ? LOST : CLOSE;
      if (win) {
        burst(run.x, run.y, '#ffe9a0', 40);
        for (const h of partners(run.o, run.x, run.y, r)) advance(h, run.o.quest);
      } else for (const h of partners(run.o, run.x, run.y, LOST * 1.5)) tell(h, text);
      changed();
    }
    function stepWave(key, run) {
      const s = stepOf(run.o),
        near = partners(run.o, run.x, run.y, LOST);
      if (!near.length)
        return finish(key, run, false, '🌑 Plus personne pour défendre le lieu… Recommence quand tu veux.');
      const foes = foesOf(key),
        before = Math.ceil(run.hp / 5);
      run.hp -= gnaw(foes, run.x, run.y, 0.055);
      if (Math.ceil(run.hp / 5) !== before) changed();
      if (run.hp <= 0)
        return finish(key, run, false, '💔 La défense a cédé. Reprends ton souffle et recommence.');
      if (foes.length || time < run.next) return;
      if (run.wave >= s.waves.length) return finish(key, run, true);
      const n = s.waves[run.wave] + Math.max(0, near.length - 1),
        names = s.seasons ? [s.seasons[run.wave]] : s.mobs;
      spawnRing(run.site, names, n, run.x, run.y, 6.5 * T, { questRun: key, quest: run.o.quest });
      run.wave++;
      run.next = time + 120;
      float(run.x, run.y - 90, '⚔️ Vague ' + run.wave + ' / ' + s.waves.length, '#ffd0a0');
      changed();
    }
    function stepEscort(key, run) {
      const s = stepOf(run.o),
        near = heroesNear(run.x, run.y, LOST).filter(h => activeAt(h, run.o));
      if (!near.length)
        return finish(
          key,
          run,
          false,
          '🐾 Tu as semé la personne que tu accompagnais. Elle t’attend au départ.'
        );
      const foes = foesOf(key),
        before = Math.ceil(run.hp / 5);
      run.hp -= gnaw(foes, run.x, run.y, 0.07);
      if (Math.ceil(run.hp / 5) !== before) changed();
      if (run.hp <= 0) return finish(key, run, false, '💔 Trop de coups : il faut repartir du départ.');
      if (!foes.length && run.hp < 100) run.hp = Math.min(100, run.hp + 0.05);
      // Embuscades, réparties le long du chemin.
      const part = run.path.length > 1 ? run.at / (run.path.length - 1) : 1;
      if (run.sprung < s.ambush.length && part >= (run.sprung + 1) / (s.ambush.length + 1)) {
        const [name, n] = s.ambush[run.sprung++];
        spawnRing(run.site, [name], n + near.length - 1, run.x, run.y, 4 * T, {
          questRun: key,
          quest: run.o.quest
        });
        float(run.x, run.y - 70, '⚠️ Embuscade !', '#ff8a6a');
        changed();
        return;
      }
      // Il attend qu'on soit là et que la voie soit libre.
      run.moving = false;
      if (foes.length || !near.some(h => Math.hypot(h.player.x - run.x, h.player.y - run.y) < 5 * T)) return;
      const next = run.path[run.at + 1];
      if (!next) return finish(key, run, true);
      const dx = next[0] - run.x,
        dy = next[1] - run.y,
        d = Math.hypot(dx, dy);
      run.moving = true;
      run.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
      if (d <= ESCORT_SPEED) {
        [run.x, run.y] = next;
        run.at++;
      } else {
        run.x += (dx / d) * ESCORT_SPEED;
        run.y += (dy / d) * ESCORT_SPEED;
      }
      if (time % 6 === 0) changed();
    }
    function stepHunt(key, run) {
      const { m } = run;
      if (m.hp <= 0) {
        [run.x, run.y] = [m.x, m.y];
        return finish(key, run, true);
      }
      if (!game.world.monsters.includes(m) || !heroesNear(run.x, run.y, LOST).length)
        finish(key, run, false, '🌑 Ton adversaire a disparu. Il reviendra si tu l’appelles.');
    }
    function stepChase(site, o) {
      const key = keyOf(o),
        hunters = heroesNear(o.x, o.y, CLOSE).filter(h => activeAt(h, o));
      let run = RUNS.get(key);
      if (!hunters.length) {
        if (run) {
          RUNS.delete(key);
          Object.assign(o, { x: run.hx, y: run.hy });
          changed();
        }
        return;
      }
      if (!run) {
        run = { k: 'chase', o, site, x: o.x, y: o.y, hx: o.x, hy: o.y, tired: 0, breath: 240, a: 0 };
        RUNS.set(key, run);
      }
      const p = hunters
          .map(h => h.player)
          .sort((a, b) => Math.hypot(a.x - run.x, a.y - run.y) - Math.hypot(b.x - run.x, b.y - run.y))[0],
        d = Math.hypot(p.x - run.x, p.y - run.y),
        away = Math.hypot(run.x - run.hx, run.y - run.hy);
      let speed = 0;
      if (d < 4.5 * T) {
        // Il fuit, s'essouffle, puis repart.
        if (run.tired > 0) run.tired--;
        else if (--run.breath <= 0) Object.assign(run, { tired: 110, breath: 200 });
        speed = run.tired > 0 ? CHASE_SPEED * 0.55 : CHASE_SPEED;
        run.a = Math.atan2(run.y - p.y, run.x - p.x);
        // Au bord de son domaine, il tourne autour au lieu de s'enfuir.
        if (away > 9 * T) {
          const back = Math.atan2(run.hy - run.y, run.hx - run.x);
          run.a = back + Math.sign(Math.sin(run.a - back) || 1) * 1.1;
        }
      } else {
        run.breath = Math.min(240, run.breath + 1);
        if (time % 90 === 0) run.a += Math.random() * 2 - 1;
        speed = time % 180 < 60 ? 0.8 : 0;
        if (away > 5 * T) run.a = Math.atan2(run.hy - run.y, run.hx - run.x);
      }
      run.moving = speed > 0;
      for (const turn of speed ? [0, 0.6, -0.6, 1.2, -1.2, 2, -2] : []) {
        const nx = run.x + Math.cos(run.a + turn) * speed,
          ny = run.y + Math.sin(run.a + turn) * speed;
        if (!canWalk(nx, ny)) continue;
        [run.x, run.y] = [nx, ny];
        run.face = Math.cos(run.a + turn) < 0 ? -1 : 1;
        break;
      }
      Object.assign(o, { x: run.x, y: run.y });
      if (time % 5 === 0) changed();
    }
    function stepRaces(sites) {
      for (const hero of game.heroes) {
        const race = RACES.get(hero);
        for (const id of Object.keys(stateOf(hero).active)) {
          const q = questById(Number(id)),
            s = q && currentStep(hero, q);
          if (s?.k !== 'race') continue;
          const a = stateOf(hero).active[q.id],
            key = q.id + '_' + a.step;
          if (!race || race.key !== key) {
            // Course interrompue (partie rechargée) : elle repart du départ.
            if (a.n) Object.assign(a, { n: 0, got: [] });
            continue;
          }
          const site = sites[s.site || q.site],
            next = site.objs.find(
              o => o.kind === 'field' && o.quest === q && o.race === a.got.length && o.step === a.step
            ),
            p = hero.player;
          if (time > race.until || p.dead) {
            RACES.delete(hero);
            Object.assign(a, { n: 0, got: [] });
            cue(hero, 'wrong');
            tell(hero, '⏱️ Trop tard ! Reprends le départ.');
            continue;
          }
          a.n = Math.max(1, Math.ceil((race.until - time) / 60));
          if (!next || Math.hypot(p.x - next.x, p.y - next.y) > 1.2 * T) continue;
          a.got.push('r' + a.got.length);
          burst(next.x, next.y, '#8affa8', 14);
          cue(hero, 'note' + (((a.got.length - 1) % 4) + 1));
          if (a.got.length >= s.n) {
            RACES.delete(hero);
            advance(hero, q);
          }
        }
      }
    }
    function step(sites) {
      for (const [key, run] of [...RUNS]) {
        // Le groupe a changé de couche : l'épreuve est abandonnée.
        if (!!run.site.under !== canaanUnder()) {
          RUNS.delete(key);
          if (run.k === 'chase') Object.assign(run.o, { x: run.hx, y: run.hy });
          continue;
        }
        if (run.k === 'wave') stepWave(key, run);
        else if (run.k === 'escort') stepEscort(key, run);
        else if (run.k === 'hunt') stepHunt(key, run);
      }
      for (const site of Object.values(sites)) {
        if (!!site.under !== canaanUnder()) continue;
        for (const o of site.objs) if (o.kind === 'field' && o.k === 'chase') stepChase(site, o);
      }
      stepRaces(sites);
      // Revoir le ciel : debout à la surface, dehors.
      if (time % 30 === 0 && !canaanUnder())
        for (const hero of game.heroes)
          for (const id of Object.keys(stateOf(hero).active)) {
            const q = questById(Number(id));
            if (q && currentStep(hero, q)?.k === 'sky' && !hero.player.dead && !hero.away) advance(hero, q);
          }
    }

    // ---------------------------------------------------------------- Objectif suivi
    // Où aller pour cette étape : { x, y, vague, area } (area : partout dans la région), ou null.
    function target(hero, site, q, s, a) {
      const mine = site.objs.filter(o => o.kind === 'field' && o.quest === q && o.step === a.step),
        p = hero.player;
      if (s.k === 'pick' || s.k === 'race') {
        const left = mine
          .filter(o => (s.k === 'pick' ? !a.got.includes(o.id) : o.race === (a.n ? a.got.length : 'go')))
          .sort((u, v) => Math.hypot(u.x - p.x, u.y - p.y) - Math.hypot(v.x - p.x, v.y - p.y))[0];
        if (left) return { x: left.x, y: left.y, vague: s.k === 'pick' && !s.caverns && !s.at };
      }
      if (s.k === 'kill' || s.k === 'loot') {
        const tx = p.x / T,
          ty = p.y / T;
        // À la surface, les proies vivent dans leurs habitats : le plus proche (mob-lairs.js).
        const lair = !site.under && CANAAN_LAIRS.nearest(tx, ty, s.mobs, hero);
        if (lair)
          return {
            x: (lair.x + 0.5) * T,
            y: (lair.y + 0.5) * T,
            area: CANAAN_LAIRS.inside(lair, tx, ty),
            vague: true,
            lair
          };
        // Tréfonds : dans la bonne région, les proies sont partout : pas de flèche.
        const there = site.under
          ? canaanUnder() &&
            canaanMobTypes().some(t => s.mobs.includes(t.name) && t.under === CANAAN_UNDER.biomeAt(tx, ty))
          : !canaanUnder() && (ZONES[canaanZoneIndexAt(tx, ty)]?.mobs || []).some(n => s.mobs.includes(n));
        const biome =
          site.under && canaanMobTypes().find(t => s.mobs.includes(t.name) && t.under !== undefined);
        const hub = !there && biome ? CANAAN_UNDER.hub(biome.under) : null;
        return hub
          ? { x: hub.x, y: hub.y, area: false, vague: true }
          : { x: px(site, 0), y: py(site, 0), area: there, vague: true };
      }
      if (s.k === 'clear') {
        const d = instances[s.instance];
        return { x: d.x * T, y: d.y * T };
      }
      if (s.k === 'work' || s.k === 'sky') return { x: p.x, y: p.y, area: true };
      const run = RUNS.get(q.id + '_' + a.step);
      if (run) return { x: run.x, y: run.y };
      return mine[0] ? { x: mine[0].x, y: mine[0].y } : null;
    }
    // Avancement d'une étape : [fait, total], ou null.
    function progress(s, a) {
      if (!s.n || s.k === 'guardian') return null;
      if (['kill', 'loot', 'chase', 'work', 'clear'].includes(s.k))
        return s.n > 1 ? [Math.min(s.n, a.n || 0), s.n] : null;
      return [Math.min(s.n, a.got.length), s.n];
    }

    // ---------------------------------------------------------------- Réseau
    const netView = () =>
      [...RUNS].map(([key, r]) => [
        key,
        r.k,
        Math.round(r.x),
        Math.round(r.y),
        Math.round(r.hp ?? 100),
        r.wave || 0,
        r.face || 0,
        r.moving ? 1 : 0
      ]);
    function applyRemote(list, sites) {
      const seen = new Set();
      for (const v of Array.isArray(list) ? list.slice(0, 40) : []) {
        if (
          !Array.isArray(v) ||
          v.length !== 8 ||
          !['wave', 'escort', 'hunt', 'chase'].includes(v[1]) ||
          !v.slice(2).every(Number.isFinite)
        )
          continue;
        const [key, k, x, y, hp, wave, face, moving] = v,
          old = RUNS.get(key);
        let o = old?.o;
        if (!o)
          for (const site of Object.values(sites))
            o ??= site.objs.find(
              f => f.kind === 'field' && keyOf(f) === key && f.k === k && f.race === undefined
            );
        if (!o) continue;
        seen.add(key);
        RUNS.set(key, {
          k,
          o,
          hx: old?.hx ?? o.x,
          hy: old?.hy ?? o.y,
          x,
          y,
          hp,
          wave,
          face,
          moving: !!moving
        });
        if (k === 'chase') Object.assign(o, { x, y });
      }
      for (const [key, run] of [...RUNS])
        if (!seen.has(key)) {
          if (run.k === 'chase') Object.assign(run.o, { x: run.hx, y: run.hy });
          RUNS.delete(key);
        }
    }

    // ---------------------------------------------------------------- Dessin
    // Créature amicale ou fuyard à partir d'une espèce du jeu (garde son propre objet pour l'animation).
    const actors = new Map();
    function mobArt(c, id, name, x, y, scale = 1, pal = null) {
      let m = actors.get(id);
      if (!m) {
        const type = canaanMobTypes().find(t => t.name === name) || MOB_TYPES[0];
        m = {
          t: type.name,
          look: type.look,
          pal: pal ? [...pal] : [...type.pal],
          lookOpts: { ...(type.opts || {}) },
          hp: 1,
          mhp: 1,
          r: 16
        };
        actors.set(id, m);
      }
      shadowAt(c, x, y + 14 * scale, 18 * scale, 5 * scale);
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);
      m.x = 0;
      m.y = 0;
      drawCanaanActor(c, m);
      c.restore();
    }
    function beast(c, icon, x, y, face) {
      const spr = CANAAN_LIFE.icon(icon);
      if (!spr) return;
      shadowAt(c, x, y + 8, spr.width * 0.3, 4);
      c.save();
      c.translate(Math.round(x), Math.round(y));
      if (face === -1 || face === 3) c.scale(-1, 1);
      c.drawImage(spr, Math.round(-spr.width / 2), Math.round(-spr.height + 8));
      c.restore();
    }
    // Quelqu'un (escorte, fuyard, prisonnier) : s décrit son apparence.
    function someone(c, id, s, x, y, face = 0, moving = false) {
      const hop = moving ? Math.abs(Math.sin(time * 0.25)) * -4 : 0;
      switch (s.art) {
        case 'sheep':
          return beast(c, 'mouton', x, y + hop, face);
        case 'fox':
          glow(c, x, y - 8, 30, '#ffb050', 0.4);
          return beast(c, 'renard', x, y + hop, face);
        case 'mole':
          beast(c, 'taupe', x, y + hop, face);
          return R(c, x - 4, y + hop - 2, 8, 3, '#ffd84a');
        case 'thief':
          shadowAt(c, x, y + 10, 14, 4);
          block(c, x - 12, y - 4 + hop, 22, 12, ['#8ac06a', '#aade8a', '#5a8a4a']);
          block(c, x + 6, y - 12 + hop, 10, 10, ['#9ad07a', '#bae89a', '#6a9a5a']);
          R(c, x + 12, y - 9 + hop, 2, 2, '#1a1418');
          return block(c, x - 20, y - 6 + hop, 9, 4, ['#e08a3a', '#f0aa5a', '#a85a1a']);
        case 'firefly': {
          const yy = y - 16 + Math.sin(time * 0.15 + x) * 5;
          glow(c, x, yy, 30, '#e8ff8a', 0.7);
          canaanLight(x, yy, 80, '#e8ff8a');
          return R(c, x - 2, yy - 2, 5, 5, '#fffde0');
        }
        case 'whirl':
          shadowAt(c, x, y + 12, 16, 5);
          for (let k = 0; k < 5; k++) {
            const w = 8 + k * 6,
              a = time * 0.3 + k;
            c.strokeStyle = k % 2 ? '#dff4ff' : '#a8cfe8';
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(x + Math.sin(a) * 3, y + 8 - k * 8, w / 2, w / 5, 0, 0, Math.PI * 1.6);
            c.stroke();
          }
          return;
        case 'ghost':
          c.globalAlpha = 0.6;
          glow(c, x, y - 20, 40, '#bfe8ff', 0.4);
          personArt(c, x, y + Math.sin(time * 0.05) * 3, { sex: 'm', hair: '#c8e8f0', outfit: 'glace' });
          c.globalAlpha = 1;
          return canaanLight(x, y - 16, 120, '#bfe8ff');
        case 'dwarf':
          return CANAAN_UNDER.dwarfArt(c, { name: s.who, ...s.dwarf }, x, y + hop, face);
        case 'mob':
          return mobArt(c, id, s.mob, x, y + hop, s.scale || 1, s.pal);
        default:
          return personArt(c, x, y + hop, s.look || { sex: 'm', race: 'humain', outfit: 'cuir' });
      }
    }
    // Point d'intérêt d'une étape en cours : lueur, icône et étincelle.
    function marker(c, o, icon, col = '#ffe9a0') {
      const bob = Math.sin(time * 0.1 + o.x) * 2.5;
      glow(c, o.x, o.y, 28, col, 0.4 + 0.2 * Math.sin(time * 0.12 + o.x));
      shadowAt(c, o.x, o.y + 10, 10, 3);
      rune(c, o.x, o.y + 4 + bob, icon, '#ffffff', 20);
    }
    // Objet du lieu ; lit : déjà fait par ce héros.
    function prop(c, o, art, lit) {
      const { x, y } = o;
      switch (art) {
        case 'lantern':
          shadowAt(c, x, y + 12, 10, 3);
          block(c, x - 3, y - 36, 6, 48, PAL.iron);
          block(c, x - 10, y - 50, 20, 16, lit ? ['#ffd890', '#fff0c0', '#c8a050'] : PAL.iron);
          block(c, x - 12, y - 54, 24, 5, PAL.iron);
          if (lit) torchFlame(c, x, y - 38, 0.7);
          return;
        case 'frame':
          shadowAt(c, x, y + 12, 18, 4);
          block(c, x - 20, y - 42, 40, 52, PAL.gold);
          block(c, x - 15, y - 37, 30, 42, lit ? ['#b8d8f0', '#ffffff', '#8aa8c8'] : PAL.dark);
          if (lit) return rune(c, x, y - 8, ['☀️', '🌑', '✦', '🕯️'][o.i] || '✦', '#1a2430', 18);
          R(c, x - 8, y - 30, 2, 26, '#8a909a');
          return R(c, x + 2, y - 26, 2, 18, '#8a909a');
        case 'house':
          shadowAt(c, x, y + 16, 26, 6);
          block(c, x - 24, y - 6, 8, 22, PAL.stone);
          block(c, x + 16, y - 6, 8, 22, PAL.stone);
          block(c, x - 24, y - 12, 48, 8, PAL.stone);
          rune(c, x, y + 4, ['🪣', '🔥', '🌷', '🗼'][o.i], '#ffffff', 16);
          if (lit) {
            glow(c, x, y - 16, 34, '#ffd84a', 0.45);
            rune(c, x, y - 18, ['⚒️', '🔔', '🧺', '🎵'][o.i], '#ffffff', 18);
          }
          return;
        case 'gear': {
          block(c, x - 9, y + 8, 4, 10, PAL.iron);
          block(c, x + 5, y + 8, 4, 10, PAL.iron);
          if (!lit) return;
          const r = o.i === 1 ? 11 : 17;
          c.save();
          c.translate(x, y);
          c.rotate(time * 0.05 * (o.i % 2 ? -1 : 1));
          c.fillStyle = OUT;
          c.beginPath();
          c.arc(0, 0, r + 4, 0, Math.PI * 2);
          c.fill();
          for (let k = 0; k < 8; k++) {
            c.rotate(Math.PI / 4);
            R(c, -3, -r - 4, 6, 6, PAL.iron[1]);
          }
          c.fillStyle = PAL.iron[0];
          c.beginPath();
          c.arc(0, 0, r, 0, Math.PI * 2);
          c.fill();
          c.restore();
          return;
        }
        case 'obelisk':
          shadowAt(c, x, y + 14, 14, 5);
          if (!lit) {
            block(c, x - 8, y - 8, 16, 20, PAL.sand);
            return R(c, x - 14, y + 6, 28, 8, '#d8b880');
          }
          block(c, x - 9, y - 48, 18, 62, PAL.sand);
          block(c, x - 12, y + 6, 24, 8, PAL.sand);
          glow(c, x, y - 34, 26, '#fff0a0', 0.5);
          return rune(c, x, y - 28, '✦', '#6a4a1a', 14);
        case 'lever':
          shadowAt(c, x, y + 12, 10, 3);
          block(c, x - 10, y, 20, 12, PAL.iron);
          c.save();
          c.translate(x, y + 2);
          c.rotate(lit ? 0.7 : -0.7);
          block(c, -2, -24, 4, 24, PAL.wood);
          block(c, -5, -28, 10, 7, ['#c84a3a', '#e86a5a', '#8a2a1a']);
          c.restore();
          return;
        case 'voice':
          shadowAt(c, x, y + 14, 16, 5);
          block(c, x - 12, y - 34, 24, 48, PAL.dark);
          block(c, x - 15, y + 8, 30, 8, PAL.dark);
          if (lit) glow(c, x, y - 10, 40, '#ffc65a', 0.4 + 0.2 * Math.sin(time * 0.08));
          R(c, x - 5, y - 22, 10, 3, lit ? '#ffe0a0' : '#20242a');
          R(c, x - 5, y - 14, 10, 3, lit ? '#ffe0a0' : '#20242a');
          R(c, x - 3, y - 6, 6, 3, lit ? '#ffe0a0' : '#20242a');
          if (lit) canaanLight(x, y - 10, 110, '#ffc65a');
          return;
        case 'grave':
          shadowAt(c, x, y + 12, 14, 4);
          block(c, x - 11, y - 18, 22, 28, PAL.stone);
          block(c, x - 8, y - 22, 16, 5, PAL.stone);
          if (lit) {
            glow(c, x, y - 6, 28, '#a8f0c0', 0.45);
            for (let k = 0; k < 3; k++) R(c, x - 6, y - 12 + k * 6, 12 - k * 2, 2, '#e0fff0');
          } else for (let k = 0; k < 3; k++) R(c, x - 6 + k * 2, y - 12 + k * 6, 7, 1, '#4a4a46');
          return;
        case 'pillar':
          shadowAt(c, x, y + 14, 16, 5);
          block(c, x - 12, y - 30, 24, 44, PAL.stone);
          block(c, x - 15, y - 34, 30, 6, PAL.stone);
          return rune(c, x, y - 6, ['🌸', '☀️', '🍂', '❄️'][Math.floor(time / 90) % 4], '#ffffff', 18);
        case 'bell':
          shadowAt(c, x, y + 14, 20, 5);
          block(c, x - 20, y - 40, 5, 54, PAL.wood);
          block(c, x + 15, y - 40, 5, 54, PAL.wood);
          block(c, x - 24, y - 46, 48, 7, PAL.wood);
          return block(c, x - 10, y - 36, 20, 20, PAL.gold);
        case 'horn':
          shadowAt(c, x, y + 12, 10, 3);
          block(c, x - 2, y - 24, 4, 36, PAL.wood);
          return block(c, x - 10, y - 30, 20, 8, PAL.gold);
        case 'candle':
          shadowAt(c, x, y + 12, 16, 4);
          block(c, x - 16, y, 32, 12, PAL.stone);
          block(c, x - 4, y - 16, 8, 16, ['#f0e8d0', '#ffffff', '#c8b890']);
          if (lit) torchFlame(c, x, y - 18, 0.8);
          return;
        case 'barrel':
          shadowAt(c, x, y + 12, 14, 4);
          block(c, x - 12, y - 18, 24, 30, PAL.wood);
          R(c, x - 12, y - 11, 24, 3, PAL.iron[0]);
          return R(c, x - 12, y + 3, 24, 3, PAL.iron[0]);
        case 'cocoon':
          shadowAt(c, x, y + 12, 14, 4);
          block(c, x - 9, y - 26, 18, 36, ['#d8d4cc', '#ffffff', '#a8a49c']);
          R(c, x - 9, y - 16, 18, 2, '#b8b4ac');
          R(c, x - 9, y - 4, 18, 2, '#b8b4ac');
          return R(c, x - 2 + Math.round(Math.sin(time * 0.2) * 2), y - 10, 4, 4, '#ffb050');
        case 'nest':
          shadowAt(c, x, y + 10, 20, 5);
          block(c, x - 18, y - 4, 36, 14, ['#6a5030', '#8a6a40', '#4a3820']);
          for (let k = 0; k < 3; k++)
            block(c, x - 13 + k * 9, y - 12, 8, 10, ['#e8d8b0', '#fff4d8', '#b8a070']);
          return;
        case 'plank':
          shadowAt(c, x, y + 8, 20, 4);
          return block(c, x - 20, y - 3, 40, 9, ['#b98a58', '#d1a66c', '#8a5a34']);
        case 'shroom':
          shadowAt(c, x, y + 8, 10, 3);
          glow(c, x, y - 8, 26, '#ff9ae8', 0.5);
          block(c, x - 3, y - 8, 6, 14, ['#f0e0f0', '#ffffff', '#c8b0c8']);
          block(c, x - 10, y - 16, 20, 9, ['#d04a9a', '#ff8ad0', '#8a2868']);
          return canaanLight(x, y - 8, 70, '#ff9ae8');
        case 'crystal':
          return crystalArt(c, x, y, lit ? '#fff0a0' : '#cfefff', 0.8);
        case 'roots':
          glow(c, x, y, 40, '#ffd84a', lit ? 0.5 : 0.25);
          for (let k = 0; k < 4; k++)
            block(c, x - 18 + k * 10, y - 2 + (k % 2) * 4, 12, 5, ['#8a6a30', '#c89a40', '#5a4218']);
          return;
        case 'chest':
          return chestArt(c, x, y, lit, '#ffd84a');
      }
      return marker(c, o, stepOf(o).icon || '✦');
    }
    // Barre de ce qu'on protège.
    function bar(c, x, y, hp, col) {
      R(c, x - 25, y, 50, 7, OUT);
      R(c, x - 24, y + 1, (48 * Math.max(0, hp)) / 100, 5, col);
    }
    function draw(c, site, o) {
      const hero = game.hero,
        s = stepOf(o),
        a = activeAt(hero, o),
        done = passed(hero, o),
        run = RUNS.get(keyOf(o));
      switch (o.k) {
        case 'pick': {
          const got = !!a && a.got.includes(o.id);
          if (STATIC.has(o.art)) {
            prop(c, o, o.art, done || got);
            if (a && !got) glow(c, o.x, o.y - 10, 36, '#ffe9a0', 0.3 + 0.15 * Math.sin(time * 0.1 + o.x));
            return;
          }
          if (!a || got) return;
          if (o.art === 'miner') {
            CANAAN_UNDER.dwarfArt(
              c,
              {
                name: 'mineur' + (o.i % 3),
                beard: ['#a8442a', '#4a2e1e', '#d8a040'][o.i % 3],
                helm: '#c8a040',
                tunic: '#4a4a3a',
                tool: 'none',
                skin: '#e8b48a'
              },
              o.x,
              o.y,
              1
            );
            for (const dx of [-12, 9]) R(c, o.x + dx, o.y + 2, 3, 14, '#8a909a');
            return glow(c, o.x, o.y, 30, '#ffe9a0', 0.25);
          }
          return prop(c, o, o.art, false);
        }
        case 'race': {
          if (!a) return;
          if (o.race === 'go') {
            flagArt(c, o.x, o.y, a.n ? '#8a909a' : '#ffd84a');
            return;
          }
          const next = !!a.n && o.race === a.got.length;
          if (a.got.length > o.race && a.n) return flagArt(c, o.x, o.y, '#8affa8');
          if (next) glow(c, o.x, o.y - 16, 60, '#ffd84a', 0.5 + 0.2 * Math.sin(time * 0.2));
          return flagArt(c, o.x, o.y, next ? '#ffd84a' : '#c84a4a');
        }
        case 'chase':
          if (a) someone(c, keyOf(o), s, o.x, o.y, run?.face || 1, run?.moving);
          return;
        case 'escort':
          if (!a) return;
          if (run) {
            someone(c, keyOf(o), s, run.x, run.y, run.face, run.moving);
            bar(c, run.x, run.y - 62, run.hp, '#8affa8');
          } else someone(c, keyOf(o), s, o.x, o.y);
          return;
        case 'hunt':
          if (a && !run) marker(c, o, s.icon, '#ff8a6a');
          return;
        case 'wave':
          if (STATIC.has(o.art) || o.art) {
            if (STATIC.has(o.art) || a || done) prop(c, o, o.art, done || !!run);
          } else if (a && !run) marker(c, o, s.icon);
          if (a && !run && o.art) glow(c, o.x, o.y - 10, 44, '#ffe9a0', 0.3 + 0.15 * Math.sin(time * 0.1));
          if (run) {
            bar(c, o.x, o.y - 70, run.hp, run.hp > 40 ? '#8affa8' : '#ff6a4a');
            glow(c, o.x, o.y - 10, 60, '#ffe9a0', 0.25);
          }
          return;
      }
    }
    // Secondes restantes d'une course, au-dessus du héros.
    function drawHero(c) {
      for (const id of Object.keys(stateOf(game.hero).active)) {
        const q = questById(Number(id)),
          s = q && currentStep(game.hero, q),
          a = stateOf(game.hero).active[id];
        if (s?.k !== 'race' || !a.n) continue;
        canaanText(c, String(a.n), P.x, P.y - 84, 20, a.n <= 5 ? '#ff6a4a' : '#ffe9a0');
      }
    }
    return Object.freeze({
      build,
      event,
      usable,
      label,
      act,
      step,
      target,
      progress,
      netView,
      applyRemote,
      draw,
      drawHero,
      mobArt,
      runs: () => RUNS,
      reset() {
        for (const run of RUNS.values())
          if (run.k === 'chase') Object.assign(run.o, { x: run.hx, y: run.hy });
        RUNS.clear();
      }
    });
  };
})();
