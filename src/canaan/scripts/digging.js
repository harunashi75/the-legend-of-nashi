// Fouilles : la pelle et ce qu'on déterre.
// - La pelle s'achète une seule fois chez un marchand (Camp de l'Aurore et villages) ; elle est rangée dans les métiers
//   du héros (prof.shovel), donc sauvegardée et envoyée à un invité avec son sac.
// - E sur la terre, l'herbe ou le sable de l'île (quand rien d'autre n'est à portée) : le héros creuse devant lui,
//   dans la direction où il regarde. Un coup de pelle dure 1,3 s (travail minuté de gathering.js : bouger
//   l'interrompt) ; le sol se creuse peu à peu, puis un petit trou reste là un moment. On ne creuse pas deux fois au
//   même endroit tant que le trou est visible.
// - Trouvailles : rien (ou un ver de terre), quelques pièces d'or, un trésor à vendre (pile du sac, rubrique
//   Autre), ou une relique du biome qui manque encore à la collection (onglet Fouilles de la touche Y).
// L'hôte décide (actions dig et shovel-buy) ; il envoie les trous à tous (état : holes) pour qu'ils se voient chez
// chacun.
(() => {
  'use strict';
  const PRICE = PROF_SHOVEL_PRICE;
  const TREASURES = PROF_TREASURES;
  const RELICS = PROF_RELICS;
  // Sol meuble où la pelle s'enfonce (herbe, sable, terre, sous-bois, feuilles…) : ni route, ni eau, ni roche.
  const DIGGABLE = new Set([1, 3, 5, 10, 11, 16, 17, 50, 51]);
  // Un trou reste 2 min 30 (il s'efface les 10 dernières secondes) ; au plus 80 à la fois.
  const HOLE_LIFE = 150 * 60;
  const HOLE_FADE = 10 * 60;
  const HOLE_MAX = 80;
  // Chances d'un coup de pelle : relique (s'il en manque une dans ce biome), trésor, or, sinon rien.
  const RELIC_CHANCE = 0.06;
  const TREASURE_CHANCE = 0.3;
  const GOLD_CHANCE = 0.3;
  const guest = () => game.mode === 'guest';
  const tell = (hero, text) => canaanLootNotice(hero, text);
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const profOf = hero => CANAAN_PROF.profOf(hero);
  const has = hero => !!profOf(hero).shovel;
  const sound = name => typeof CANAAN_SOUND === 'object' && CANAAN_SOUND.cue?.(name);
  const ZONE_NAMES = [
    'Plaines verdoyantes',
    'Forêt ancienne',
    'Marais brumeux',
    'Forêt automnale',
    'Désert oublié',
    'Forêt enchantée'
  ];

  // ---------------------------------------------------------------- Où creuser
  // Endroit creusé : devant le héros, dans la direction où il regarde, au niveau de ses pieds.
  function spotOf(hero) {
    const p = hero.player,
      a = CANAAN_WEAPON_LOOK.aimOf(hero, p);
    return { x: Math.round(p.x + Math.cos(a) * TS * 0.95), y: Math.round(p.y + 16 + Math.sin(a) * TS * 0.6) };
  }
  let holes = [];
  // Vérifie qu'on peut creuser ici : rien (c'est bon), 'ground' (sol trop dur ou lieu protégé) ou 'hole' (déjà creusé).
  function blocked(x, y) {
    if (game.world.instance || canaanUnder()) return 'ground';
    const tx = Math.floor(x / TS),
      ty = Math.floor(y / TS),
      t = game.world.overworld?.[ty]?.[tx];
    if (
      !DIGGABLE.has(t) ||
      BRIDGE_TILES.has(ty * MAPW + tx) ||
      isSafe(tx, ty) ||
      canaanRoomAt(tx, ty) ||
      canaanQuestWalk(tx, ty) !== null ||
      !canWalk(x, y)
    )
      return 'ground';
    if (game.world.npcs.some(n => canaanHere(n) && Math.hypot(n.x - x, n.y - y) < TS * 1.6)) return 'ground';
    if (CANAAN_GATHER.nodes().some(n => canaanHere(n) && Math.hypot(n.x - x, n.y - y) < TS * 1.1))
      return 'ground';
    if (holes.some(h => Math.hypot(h.x - x, h.y - y) < TS * 0.75)) return 'hole';
    return null;
  }
  const WHY = {
    ground: '🪏 Le sol est trop dur ici : creuse dans la terre, l’herbe ou le sable.',
    hole: '🪏 Tu as déjà creusé ici.'
  };

  // ---------------------------------------------------------------- Hôte : acheter, creuser, trouver
  function buy(hero) {
    const prof = profOf(hero);
    if (prof.shovel) return (tell(hero, '🪏 Tu as déjà ta pelle.'), false);
    if (!nearMerchant(hero)) return (tell(hero, '🛍️ Va voir un marchand pour acheter la pelle.'), false);
    if (hero.player.gold < PRICE)
      return (
        tell(hero, '🪙 Il te manque ' + (PRICE - Math.floor(hero.player.gold)) + ' or pour la pelle.'),
        false
      );
    hero.player.gold -= PRICE;
    prof.shovel = 1;
    hero.netBag = null;
    hero.netShop = null;
    tell(hero, '🪏 Pelle achetée ! Appuie sur E sur la terre, l’herbe ou le sable pour creuser.');
    if (hero === game.hero) sound('fanfare');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function start(hero) {
    const p = hero?.player;
    if (!p || p.dead || hero.away) return false;
    if (!has(hero)) return (tell(hero, '🪏 Il te faut une pelle : le marchand en vend une.'), false);
    const at = spotOf(hero),
      why = blocked(at.x, at.y);
    if (why) return (tell(hero, WHY[why]), false);
    return CANAAN_GATHER.startWork(hero, 'dig', at, () => finish(hero, at));
  }
  // Tirage d'une relique du biome qui manque encore, ou null.
  function missingRelic(hero, zone) {
    const finds = profOf(hero).finds || {},
      left = Object.keys(RELICS).filter(id => RELICS[id].zone === zone && !finds[id]);
    return left.length ? left[Math.floor(Math.random() * left.length)] : null;
  }
  function finish(hero, at) {
    const why = blocked(at.x, at.y);
    // Un autre héros vient de creuser au même endroit.
    if (why) return (tell(hero, WHY[why]), false);
    const tx = Math.floor(at.x / TS),
      ty = Math.floor(at.y / TS);
    holes.push({ x: at.x, y: at.y, t: time, tile: game.world.overworld[ty][tx] });
    if (holes.length > HOLE_MAX) holes.shift();
    holesChanged++;
    const prof = profOf(hero),
      zone = canaanZoneKin(ZONES.indexOf(regionAt(tx, ty))),
      relic = zone >= 0 && zone < 6 && Math.random() < RELIC_CHANCE ? missingRelic(hero, zone) : null,
      roll = Math.random(),
      mine = hero === game.hero;
    if (relic) {
      const r = RELICS[relic],
        found = Object.keys(prof.finds).length + 1;
      prof.finds[relic] = (prof.finds[relic] || 0) + 1;
      float(at.x, at.y - 46, r.icon + ' ' + r.name, '#ffe08a');
      burst(at.x, at.y - 10, '#ffe08a', 18);
      tell(
        hero,
        '✨ Relique trouvée : ' +
          r.name +
          ' ! Collection des fouilles : ' +
          found +
          ' / ' +
          Object.keys(RELICS).length +
          ' (touche Y).'
      );
      if (mine) sound('fanfare');
    } else if (roll < TREASURE_CHANCE) {
      const id = profRollWeighted(
          Object.entries(TREASURES).map(([k, t]) => [k, t.weight]),
          Math.random
        ),
        t = TREASURES[id];
      if (!CANAAN_BAG.room(hero, 'treasure', id, 0, 1)) {
        tell(hero, '🎒 Sac plein : tu laisses ' + t.name + ' au fond du trou.');
      } else {
        CANAAN_BAG.add(hero, 'treasure', id, 0, 1);
        float(at.x, at.y - 40, t.icon + ' ' + t.name, '#e8c070');
        burst(at.x, at.y - 8, '#e8c070', 10);
        if (mine) sound('puzzle');
      }
    } else if (roll < TREASURE_CHANCE + GOLD_CHANCE) {
      const gold = Math.max(1, Math.round(2 + Math.random() * 6 + clampLevel(hero.level) * 0.35));
      hero.player.gold += gold;
      float(at.x, at.y - 40, '🪙 +' + gold + ' or', '#ffd54a');
      if (mine) sound('chest');
    } else
      float(at.x, at.y - 36, Math.random() < 0.3 ? '🪱 Rien qu’un ver de terre…' : 'Rien ici…', '#c8b8a0');
    hero.netBag = null;
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'dig') return start(hero);
    if (action.op === 'shovel-buy') return buy(hero);
    return false;
  }

  // ---------------------------------------------------------------- Trous partagés (hôte → invités)
  let holesChanged = 0,
    holesSent = -1,
    holesAt = 0;
  // Les trous qui durent encore ; les plus vieux disparaissent.
  function live() {
    if (holes.length && holes[0].t + HOLE_LIFE <= time) holes = holes.filter(h => h.t + HOLE_LIFE > time);
    return holes;
  }
  // Envoyés quand la liste change, et toutes les 3 s pour un invité qui vient d'arriver : [x, y, âge en s, sol].
  function netView() {
    if (holesSent === holesChanged && time - holesAt < 180) return undefined;
    holesSent = holesChanged;
    holesAt = time;
    return live().map(h => [h.x, h.y, Math.floor((time - h.t) / 60), h.tile]);
  }
  function applyRemote(list) {
    if (!Array.isArray(list)) return;
    holes = list
      .slice(0, HOLE_MAX)
      .filter(h => Array.isArray(h) && h.slice(0, 4).every(Number.isFinite))
      .map(([x, y, age, tile]) => ({ x, y, t: time - Math.max(0, age) * 60, tile: tile | 0 }));
  }

  // ---------------------------------------------------------------- Touche E
  function interact() {
    if (!has(game.hero) || game.world.instance || canaanUnder() || P.dead) return false;
    // Même vérification que l'hôte, pour répondre tout de suite.
    const at = spotOf(game.hero),
      why = blocked(at.x, at.y);
    if (why) return (toast(WHY[why]), true);
    if (guest()) CANAAN_NET.requestAction({ op: 'dig' });
    else start(game.hero);
    return true;
  }
  function buyMine() {
    if (guest()) return CANAAN_NET.requestAction({ op: 'shovel-buy' });
    const done = buy(game.hero);
    if (CANAAN_SHOP.isOpen()) CANAAN_SHOP.render();
    return done;
  }

  // ---------------------------------------------------------------- Dessin des trous
  // Couleurs : la terre retournée prend un peu de la teinte du sol (sable plus clair, sous-bois plus sombre).
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, k) =>
    '#' +
    hex(a)
      .map((v, i) => Math.round(v + (hex(b)[i] - v) * k))
      .map(v => v.toString(16).padStart(2, '0'))
      .join('');
  const sprites = new Map();
  // Trou en pixels (20 × 11), du petit grattage (étape 1) au trou fini avec son tas de terre (étape 4).
  function sprite(tile, stage) {
    const key = tile + ':' + stage;
    if (sprites.has(key)) return sprites.get(key);
    const ground = BIOME_COLORS[tile] || '#568e45',
      sandy = tile === 3,
      dirt = mix(sandy ? '#c8a060' : '#7a5232', ground, 0.25),
      dirtLight = mix(dirt, '#fff4d8', 0.25),
      dirtDark = mix(dirt, '#1a0e06', 0.35),
      pit = sandy ? '#5a4024' : '#2a180c',
      pitDeep = sandy ? '#3a2814' : '#160c06',
      cv = document.createElement('canvas');
    cv.width = 20;
    cv.height = 11;
    const g = cv.getContext('2d'),
      R = (x, y, c) => {
        g.fillStyle = c;
        g.fillRect(x, y, 1, 1);
      },
      noise = (x, y) => {
        const n = Math.sin(x * 12.9898 + y * 78.233 + tile * 3.1) * 43758.5453;
        return n - Math.floor(n);
      },
      hole = [0.32, 0.5, 0.68, 0.74][stage - 1],
      rim = hole + 0.26;
    for (let y = 0; y < 11; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x + 0.5 - 8) / 8,
          dy = (y + 0.5 - 5.5) / 5,
          d = Math.sqrt(dx * dx + dy * dy);
        if (d < hole) {
          // Fond du trou : plus sombre en haut (l'ombre du bord), un peu de terre éclairée en bas.
          R(x, y, dy < -hole * 0.35 ? pitDeep : dy > hole * 0.55 ? dirtDark : pit);
        } else if (d < rim + (noise(x, y) - 0.5) * 0.22) {
          // Bord de terre retournée, éclairé en haut, en mottes.
          const top = dy < 0;
          R(x, y, noise(x + 7, y) < 0.18 ? dirtDark : top && noise(x, y + 3) < 0.45 ? dirtLight : dirt);
        }
      }
    // Trou fini : le tas de terre sorti, à côté.
    if (stage >= 4)
      for (let y = 1; y < 8; y++)
        for (let x = 14; x < 20; x++) {
          const dx = (x + 0.5 - 16.8) / 3,
            dy = (y + 0.5 - 5.5) / 2.6;
          if (dx * dx + dy * dy < 1 + (noise(x, y) - 0.5) * 0.4)
            R(x, y, dy < -0.3 ? dirtLight : dy > 0.5 ? dirtDark : dirt);
        }
    sprites.set(key, cv);
    return cv;
  }
  const SCALE = 3;
  function drawHole(c, x, y, tile, stage, alpha = 1) {
    const img = sprite(tile, stage);
    c.globalAlpha = alpha;
    c.drawImage(
      img,
      Math.round(x - 8 * SCALE),
      Math.round(y - 5.5 * SCALE),
      img.width * SCALE,
      img.height * SCALE
    );
  }
  // Sol de l'île : les trous finis, puis ceux qu'on est en train de creuser (ils grandissent à chaque coup de pelle).
  function drawGround(c) {
    if (game.world.instance || canaanUnder()) return;
    const near = (x, y) => Math.abs(x - camX - W / 2) < W / 2 + 60 && Math.abs(y - camY - H / 2) < H / 2 + 60;
    c.save();
    c.imageSmoothingEnabled = false;
    for (const h of live()) {
      if (!near(h.x, h.y)) continue;
      const left = h.t + HOLE_LIFE - time;
      drawHole(c, h.x, h.y, h.tile, 4, Math.min(1, left / HOLE_FADE));
    }
    for (const hero of game.heroes) {
      const w = CANAAN_GATHER.workOf(hero);
      if (!w || w.kind !== 'dig' || !near(w.tx, w.ty)) continue;
      const tx = Math.floor(w.tx / TS),
        ty = Math.floor(w.ty / TS),
        tile = game.world.overworld?.[ty]?.[tx] ?? 1;
      drawHole(c, w.tx, w.ty, tile, Math.min(3, 1 + Math.floor(w.p * 3)));
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Boutique et onglet Fouilles (Y)
  function shopHTML() {
    const owned = has(game.hero);
    return (
      '<section class="bag-upgrade shovel-offer"><div><strong>⟦tool_shovel⟧ Pelle de fouilleur</strong>' +
      '<p>Creuse la terre, l’herbe et le sable de l’île (touche E) : de l’or, des trésors à vendre et des reliques à collectionner (touche Y).</p></div>' +
      (owned
        ? '<b class="bag-max">✓ Tu as ta pelle</b>'
        : '<button type="button" data-action="buyShovel" ' +
          (P.gold < PRICE ? 'disabled' : '') +
          '>Acheter la pelle · 🪙 ' +
          PRICE +
          ' or</button>') +
      '</section>'
    );
  }
  function tab(hero) {
    const prof = profOf(hero),
      finds = prof.finds || {},
      ids = Object.keys(RELICS),
      found = ids.filter(id => finds[id]).length;
    let html =
      '<p class="ach-summary">Reliques trouvées <b>' +
      found +
      ' / ' +
      ids.length +
      '</b> <span class="muted">— ' +
      (prof.shovel
        ? 'ta pelle est prête : E sur la terre, l’herbe ou le sable de l’île.'
        : 'achète une pelle chez un marchand (' + PRICE + ' or) pour creuser.') +
      '</span></p>';
    for (let zone = 0; zone < 6; zone++) {
      const list = ids.filter(id => RELICS[id].zone === zone),
        n = list.filter(id => finds[id]).length;
      html +=
        '<h3 class="ach-group">' +
        esc(ZONE_NAMES[zone]) +
        ' <small>' +
        n +
        ' / ' +
        list.length +
        '</small></h3><div class="beast-grid relic-grid">' +
        list
          .map(id => {
            const r = RELICS[id],
              known = !!finds[id];
            return (
              '<div class="beast-card relic-card' +
              (known ? ' killed' : ' unknown') +
              '"><span class="beast-img relic-ico">' +
              r.icon +
              '</span><b>' +
              (known ? esc(r.name) : '???') +
              '</b><small>' +
              (known ? esc(r.bio) : 'Pas encore déterrée.') +
              '</small></div>'
            );
          })
          .join('') +
        '</div>';
    }
    html +=
      '<h3 class="ach-group">Trésors à vendre</h3><div class="beast-grid relic-grid treasure-grid">' +
      Object.entries(TREASURES)
        .map(([id, t]) => {
          const n = CANAAN_BAG.count(hero, 'treasure', id, 0);
          return (
            '<div class="beast-card relic-card' +
            (n ? ' seen' : '') +
            '"><span class="beast-img relic-ico">' +
            t.icon +
            '</span><b>' +
            esc(t.name) +
            '</b><small>🪙 ' +
            t.value +
            ' or</small><span class="beast-kills">' +
            (n ? '× ' + n : '') +
            '</span></div>'
          );
        })
        .join('') +
      '</div>';
    return html;
  }
  // Pour rafraîchir la fenêtre Y quand une trouvaille arrive.
  const signature = hero => {
    const prof = profOf(hero);
    return JSON.stringify([prof.shovel, prof.finds, prof.treasure]);
  };

  window.CANAAN_DIG = Object.freeze({
    PRICE,
    TREASURES,
    RELICS,
    has,
    blocked,
    spotOf,
    holes: () => live(),
    buy,
    start,
    finish,
    handle,
    netView,
    applyRemote,
    interact,
    buyMine,
    drawGround,
    shopHTML,
    tab,
    signature
  });
})();
