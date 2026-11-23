// Guide du joueur : ce qu'un nouveau venu doit découvrir sans lire de manuel.
// - Conseils de Lumi : une carte en bas de l'écran, au bon moment et une seule fois chacun (premiers pas, quête
//   acceptée, équipement trouvé, talent à placer, sac qui se remplit, échoppe, donjon à portée…). Avant que Lumi ne
//   rejoigne le héros (quête 1), le conseil s'affiche comme une simple astuce. Conseils déjà vus : préférence « guide »
//   de l'appareil ; Paramètres → Interface → Conseils de Lumi les coupe (canaanDisplay.tips).
// - Pastilles des boutons de menu : place prise dans le sac (et en rouge quand il est presque plein), point doré sur le
//   sac quand un équipement meilleur que celui porté y est entré depuis la dernière ouverture, point doré sur Classe et
//   talents tant qu'une case de talent est libre.
// - Enseigne des marchands : une bourse 💰 qui flotte devant la porte des bâtiments qui ont un marchand.
// Tout est calculé chez chaque joueur, pour son héros, au moment du dessin ; rien ne passe par le réseau.
(() => {
  'use strict';

  // ---------------------------------------------------------------- Conseils déjà vus
  const seen = (() => {
    const raw = CANAAN_PREFERENCES.read('guide', {}).seen;
    return raw && typeof raw === 'object' ? { ...raw } : {};
  })();
  const markSeen = id => {
    seen[id] = 1;
    CANAAN_PREFERENCES.write('guide', { seen });
  };
  const key = id => CANAAN_KEYS.labelOf(id) || '?';

  // ---------------------------------------------------------------- Ce que le guide observe
  const qstate = hero => CANAAN_QUESTS.state(hero);
  const hasLumi = hero => !!qstate(hero)?.flags.lumi;
  const freeTalents = hero => {
    const a = CANAAN_CLASS.audit(hero);
    return a && a.id ? Math.max(0, a.slots - a.talents.length) : 0;
  };
  const bagLoad = hero => {
    const limit = canaanBagLimit(hero);
    return { used: canaanBagUsed(hero), limit };
  };
  const upgrades = hero => hero.inventory.filter(it => gearUpgrade(it, hero));
  // Bâtiments de l'île qui ont un marchand (Échoppe de Lira) : leur porte, en pixels.
  const shops = () =>
    CANAAN_HOUSE.buildings()
      .filter(b => b.kind === 'shop')
      .map(b => ({ ...b.door, name: b.name }));
  const near = (p, o, tiles) => Math.hypot(p.x - o.x, p.y - o.y) < tiles * TS;
  // Donjons et raids de la surface que le héros peut tenter : niveau atteint.
  const openDungeons = hero =>
    instances
      .filter(d => !d.under && !d.raid && clampLevel(hero.level) >= d.level)
      .sort((a, b) => a.level - b.level);

  // ---------------------------------------------------------------- Les conseils
  // when(hero) : le moment est venu ; text(hero) : ce que dit Lumi. Un id finissant par « : » est suivi d'une clé
  // (talent:10, donjon:mine…) : le conseil revient à chaque nouvelle occasion.
  const TIPS = [
    {
      id: 'welcome',
      when: () => true,
      text: () =>
        tt(
          'Bienvenue à Canaan ! Déplace-toi avec {h} {g} {b} {d} (ou les flèches), attaque avec le clic gauche et parle aux habitants avec {e}.',
          {
            h: key('moveUp'),
            g: key('moveLeft'),
            b: key('moveDown'),
            d: key('moveRight'),
            e: key('interact')
          }
        )
    },
    {
      id: 'tracker',
      when: () => trackerShown(),
      text: () =>
        tt(
          'L’encadré à droite, sous la mini-carte, te montre toujours où aller : suis sa flèche jusqu’au personnage marqué d’un « ! » doré.'
        )
    },
    {
      id: 'quest',
      when: hero => Object.keys(qstate(hero)?.active || {}).length > 0,
      text: () =>
        tt(
          'Quête acceptée ! Sa prochaine étape est dans l’encadré à droite. Le journal ({l}) raconte toutes tes quêtes et permet d’en suivre une autre.',
          { l: key('journal') }
        )
    },
    {
      id: 'lumi',
      when: hasLumi,
      text: () =>
        tt(
          'Coucou, c’est Lumi ! Je reste avec toi : je vole toujours du côté où tu dois aller, et je te soufflerai des conseils en chemin.'
        )
    },
    {
      id: 'gear',
      when: hero => upgrades(hero).length > 0,
      text: () =>
        tt(
          'Tu as trouvé un équipement meilleur que le tien ! Ouvre ton sac ({i}) et clique dessus pour l’équiper : le ▲ vert marque ce qui est mieux que ce que tu portes.',
          { i: key('inventory') }
        )
    },
    {
      id: 'talent:',
      sub: hero => (freeTalents(hero) > 0 ? window.CANAAN_CLASS.audit(hero).slots : null),
      text: () =>
        tt(
          'Tu as un talent à choisir ! Ouvre Classe et talents ({t}) : le bouton garde un point doré tant qu’une case est libre.',
          { t: key('talents') }
        )
    },
    {
      id: 'bag',
      when: hero => {
        const b = bagLoad(hero);
        return b.used >= Math.ceil(b.limit * 0.75);
      },
      text: hero => {
        const b = bagLoad(hero);
        return tt(
          'Ton sac se remplit ({n} / {max}) ! Lira rachète ton butin à l’Échoppe du Camp de l’Aurore (la bourse 💰 sur la carte, {m}). Tu peux aussi démanteler une pièce (clic droit).',
          { n: b.used, max: b.limit, m: key('map') }
        );
      }
    },
    {
      id: 'shop',
      when: hero => !game.world.instance && !canaanUnder() && shops().some(s => near(hero.player, s, 5)),
      text: () =>
        tt(
          'Voici l’Échoppe de Lira, la marchande du camp : entre ({e}) pour vendre ton butin, acheter des potions et agrandir ton sac.',
          { e: key('interact') }
        )
    },
    {
      id: 'dungeon:',
      sub: hero => {
        const d = openDungeons(hero).at(-1);
        return d ? d.name : null;
      },
      text: hero => {
        const d = openDungeons(hero).at(-1);
        return tt(
          'Un donjon est à ta portée : {nom} (niveau {n}). Son portail est sur la carte ({m}). Le meilleur butin s’y trouve : emmène des compagnons ou des amis !',
          { nom: d.name, n: d.level, m: key('map') }
        );
      }
    }
  ];

  // ---------------------------------------------------------------- Carte du conseil
  const card = document.createElement('div');
  card.id = 'lumiTip';
  card.hidden = true;
  card.setAttribute('role', 'status');
  card.innerHTML =
    '<i class="lumi-orb" aria-hidden="true"></i><div><b></b><p></p></div><button type="button" aria-label="Fermer">✕</button>';
  document.body.appendChild(card);
  const cardName = card.querySelector('b'),
    cardText = card.querySelector('p');
  card.querySelector('button')?.addEventListener('click', () => hide());
  const SHOW_FRAMES = 60 * 12,
    GAP_FRAMES = 60 * 3;
  let shownAt = -Infinity,
    hiddenAt = -Infinity,
    speaking = false,
    playing = 0,
    lastTime = -1;
  function show(text, hero) {
    const lumi = hasLumi(hero);
    cardName.textContent = lumi ? 'Lumi' : tt('Astuce');
    cardText.textContent = text;
    card.classList.toggle('lumi', lumi);
    card.hidden = false;
    speaking = true;
    shownAt = time;
    if (typeof CANAAN_SOUND !== 'undefined') CANAAN_SOUND.cue?.('puzzle');
  }
  function hide() {
    if (!speaking) return;
    card.hidden = true;
    speaking = false;
    hiddenAt = time;
  }
  // Le premier conseil attend que l'écran se soit posé ; tant que le bienvenue n'est pas passé, c'est lui le suivant.
  function nextTip(hero) {
    if (playing < 150) return null;
    for (const tip of seen.welcome ? TIPS : TIPS.slice(0, 1)) {
      let id = tip.id;
      if (tip.sub) {
        const s = tip.sub(hero);
        if (s == null) continue;
        id += s;
      } else if (!tip.when(hero)) continue;
      if (!seen[id]) return { tip, id };
    }
    return null;
  }

  // ---------------------------------------------------------------- Pastilles des boutons de menu
  const menuButton = action => document.querySelector('#menuButtons button[data-action="' + action + '"]');
  function badge(button, cls, on, text) {
    if (!button) return;
    let el = button.querySelector('.' + cls);
    if (!on) return el?.remove();
    if (!el) {
      el = document.createElement('span');
      el.className = cls;
      el.setAttribute('aria-hidden', 'true');
      button.appendChild(el);
    }
    if (text !== undefined && el.textContent !== text) el.textContent = text;
  }
  // Équipements déjà vus dans le sac : ceux du chargement, puis tout ce qui y était à la dernière ouverture.
  let known = null;
  const bagOpen = () => typeof modalOpen === 'function' && modalOpen() && currentGearPanel === 'inventory';
  function badges(hero) {
    const bag = menuButton('toggleInventory'),
      b = bagLoad(hero);
    if (!known || bagOpen()) known = new Set(hero.inventory.map(it => it.id));
    const fresh = upgrades(hero).some(it => !known.has(it.id));
    badge(bag, 'menu-count', true, b.used + '/' + b.limit);
    bag?.querySelector('.menu-count')?.classList.toggle('full', b.used >= b.limit - 1);
    bag?.querySelector('.menu-count')?.classList.toggle('warn', b.used >= Math.ceil(b.limit * 0.75));
    badge(bag, 'menu-dot', fresh);
    badge(menuButton('toggleTalents'), 'menu-dot', freeTalents(hero) > 0);
  }

  // ---------------------------------------------------------------- Boucle
  const trackerShown = () => {
    const el = document.getElementById('questTracker');
    return !!el && !el.hidden;
  };
  // Une fois par image dessinée (jamais pendant la simulation, qui ne touche pas à l'écran) ; le reste du travail
  // toutes les 20 images du jeu.
  function step() {
    if (!started) {
      playing = 0;
      return;
    }
    if (paused || time === lastTime) return;
    lastTime = time;
    playing++;
    if (time % 20) return;
    const hero = game.hero;
    badges(hero);
    if (speaking && time - shownAt > SHOW_FRAMES) hide();
    if (!canaanDisplay.tips) return hide();
    if (speaking || time - hiddenAt < GAP_FRAMES || hero.player.dead) return;
    const next = nextTip(hero);
    if (!next) return;
    markSeen(next.id);
    show(next.tip.text(hero), hero);
  }

  // Enseigne des marchands : une bourse qui flotte au-dessus de la porte (dessinée dans le monde).
  function glow(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }
  function draw() {
    step();
    if (!started || game.world.instance || canaanUnder()) return;
    const list = shops();
    if (!list.length) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    ctx.font = '22px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    for (const s of list) {
      const x = s.x,
        y = s.y - 1.8 * TS + Math.sin(time * 0.06) * 3;
      if (x < camX - 60 || x > camX + W + 60 || y < camY - 60 || y > camY + H + 60) continue;
      glow(x, y - 7, 26, '#ffd84a', 0.45);
      ctx.fillText('💰', x, y);
    }
    ctx.restore();
  }

  window.CanaanStages.drawGuide = draw;
  window.CANAAN_GUIDE = Object.freeze({
    // Lumi parle (anneau autour d'elle, quests.js).
    speaking: () => speaking,
    shops,
    // Tests et Paramètres : oublier les conseils vus.
    reset: () => {
      for (const k of Object.keys(seen)) delete seen[k];
      CANAAN_PREFERENCES.write('guide', { seen });
    },
    seen: () => ({ ...seen }),
    tips: () => TIPS.map(t => t.id)
  });
})();
