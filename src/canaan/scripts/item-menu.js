// Menu contextuel des objets (clic droit, ou bouton X de la manette) : équiper, Arme 2, vendre chez un marchand,
// démanteler, manger… Remplace les petits boutons posés dans les coins des cases.
// Une case le demande par data-menu :
//   gear    (data-index)   pièce du sac (hero.inventory)
//   satchel (data-id)      pièce de la sacoche de butin
//   stack   (data-token)   pile du sac (repas, matériaux, enchantements…)
//   artefact (data-artefact) artéfact de l'Arène (emplacements et collection de la fiche C)
// Chaque entrée appelle les mêmes fonctions que les clics : l'invité en ligne passe par l'hôte comme avant.
(() => {
  'use strict';
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let box = null,
    entries = [];

  function close() {
    if (!box) return;
    box.remove();
    box = null;
    entries = [];
  }
  const merchant = () => typeof nearMerchant === 'function' && nearMerchant();

  // ---------------------------------------------------------------- Entrées selon la case
  function gearMenu(el) {
    const index = Number(el.dataset.index),
      item = game.hero.inventory[index];
    if (!item) return null;
    const id = String(item.id),
      // Le sac a pu changer entre l'ouverture du menu et le choix : on retrouve la pièce par son identifiant.
      at = () => game.hero.inventory.findIndex(it => String(it.id) === id),
      weapon = item.slot === 'weapon',
      ring = item.slot === 'ring',
      list = [
        {
          icon: '⚔️',
          label: weapon ? 'Équiper (Arme 1)' : ring ? 'Équiper (Bague 1)' : 'Équiper',
          run: () => at() >= 0 && equipBagIndex(at(), ring ? 'ring' : null)
        }
      ];
    if (ring)
      list.push({
        icon: '⟦slot_ring⟧',
        label: 'Équiper en Bague 2',
        run: () => at() >= 0 && equipBagIndex(at(), 'ring2')
      });
    if (weapon)
      list.push({
        icon: '⟦w_dualsword⟧',
        label: 'Équiper en Arme 2',
        run: () => at() >= 0 && equipReserveWeapon(at())
      });
    if (merchant())
      list.push({
        icon: '💰',
        label: 'Vendre · ' + gearSellValue(item) + ' or',
        run: () => at() >= 0 && sellInventoryCell(at(), id)
      });
    if (CANAAN_SALVAGE.canSalvage(item))
      list.push({
        icon: '⚒️',
        label: 'Démanteler',
        danger: true,
        run: () => CANAAN_SALVAGE.salvageMine(id)
      });
    return { title: gearDisplayName(item), color: rarityInfo(item).color, list };
  }
  function satchelMenu(el) {
    const id = String(el.dataset.id || ''),
      item = CANAAN_SALVAGE.of(game.hero).find(it => String(it.id) === id);
    if (!item) return null;
    const list = [{ icon: '🎒', label: 'Reprendre dans le sac', run: () => CANAAN_SALVAGE.takeMine(id) }];
    if (CANAAN_SALVAGE.canSalvage(item))
      list.push({
        icon: '⚒️',
        label: 'Démanteler',
        danger: true,
        run: () => CANAAN_SALVAGE.salvageMine(id)
      });
    return { title: gearDisplayName(item), color: rarityInfo(item).color, list };
  }
  // Ce qu'un clic fait d'une pile, quand il fait quelque chose.
  const USE_LABEL = {
    meal: ['⟦prof_cooking⟧', 'Manger'],
    ench: ['✨', 'Enchanter une pièce'],
    dust: ['⟦prof_enchanting⟧', 'Ouvrir l’enchanteur']
  };
  function stackMenu(el) {
    const token = el.dataset.token,
      p = CANAAN_BAG.parse(token);
    if (!p) return null;
    const info = CANAAN_BAG.info(p),
      list = [];
    if (USE_LABEL[p.kind]) {
      const [icon, label] = USE_LABEL[p.kind];
      list.push({ icon, label, run: () => CANAAN_BAG.use(token) });
    }
    if (merchant() && CANAAN_BAG.sellable(p))
      list.push({
        icon: '💰',
        label: (p.n > 1 ? 'Vendre ×' + p.n : 'Vendre') + ' · ' + CANAAN_BAG.price(p) + ' or',
        run: () => CANAAN_SHOP.sellToken(token)
      });
    if (!list.length) return null;
    return { title: info.name, color: info.color, list };
  }
  function artefactMenu(el) {
    const id = el.dataset.artefact,
      a = CANAAN_ARTEFACTS.get(id);
    if (!a || !CANAAN_ARTEFACTS.rank(id)) return null;
    const worn = CANAAN_ARTEFACTS.equipped().includes(id);
    return {
      title: a.name,
      color: a.light,
      list: [
        worn
          ? { icon: '✖', label: 'Retirer', run: () => toggleArtefact(id) }
          : { icon: '🔮', label: 'Équiper', run: () => equipArtefact(id) }
      ]
    };
  }
  const MENUS = { gear: gearMenu, satchel: satchelMenu, stack: stackMenu, artefact: artefactMenu };

  // ---------------------------------------------------------------- Fenêtre
  function open(el, x, y) {
    close();
    const make = MENUS[el.dataset.menu],
      menu = make ? make(el) : null;
    if (!menu || !menu.list.length) return false;
    hideGearTooltip();
    entries = menu.list;
    box = document.createElement('div');
    box.id = 'itemMenu';
    box.setAttribute('role', 'menu');
    box.innerHTML =
      '<div class="item-menu-title" style="color:' +
      esc(menu.color) +
      '">' +
      esc(menu.title) +
      '</div>' +
      entries
        .map(
          (e, i) =>
            '<button type="button" role="menuitem" class="item-menu-entry' +
            (e.danger ? ' danger' : '') +
            '" data-entry="' +
            i +
            '"><span class="item-menu-icon">' +
            CANAAN_ICONS.html(e.icon) +
            '</span>' +
            esc(e.label) +
            '</button>'
        )
        .join('') +
      '<button type="button" role="menuitem" class="item-menu-entry cancel" data-entry="-1">' +
      '<span class="item-menu-icon"></span>Annuler</button>';
    document.body.appendChild(box);
    // Dans l'écran, sous le pointeur ou à côté de la case.
    const w = box.offsetWidth || 200,
      h = box.offsetHeight || 120;
    box.style.left = Math.max(4, Math.min(x, innerWidth - w - 4)) + 'px';
    box.style.top = Math.max(4, Math.min(y, innerHeight - h - 4)) + 'px';
    box.querySelector('.item-menu-entry')?.focus?.({ preventScroll: true });
    return true;
  }
  function choose(i) {
    const entry = entries[i];
    close();
    if (entry) entry.run();
  }
  // Ouvrir le menu d'une case depuis la manette (ou un test) : à droite de la case.
  function openFor(el) {
    if (!el?.dataset?.menu) return false;
    const r = el.getBoundingClientRect();
    return open(el, r.left + r.width * 0.6, r.top + r.height * 0.6);
  }

  const cellOf = event => {
    let node = event.target;
    if (node && node.nodeType === 3) node = node.parentElement;
    return node && typeof node.closest === 'function' ? node.closest('[data-menu]') : null;
  };
  document.addEventListener('contextmenu', event => {
    if (box && box.contains(event.target)) return event.preventDefault();
    const el = cellOf(event);
    if (!el) return close();
    event.preventDefault();
    open(el, event.clientX, event.clientY);
  });
  // Un choix dans le menu ; un clic ailleurs le ferme sans rien faire.
  document.addEventListener(
    'pointerdown',
    event => {
      if (box && !box.contains(event.target)) close();
    },
    true
  );
  document.addEventListener('click', event => {
    if (!box) return;
    let node = event.target;
    if (node && node.nodeType === 3) node = node.parentElement;
    const button = node?.closest?.('[data-entry]');
    if (button && box.contains(button)) {
      event.stopPropagation();
      choose(Number(button.dataset.entry));
    }
  });
  // Échap ferme le menu avant tout autre usage de la touche (fermer la fenêtre, pause).
  addEventListener(
    'keydown',
    event => {
      if (!box || event.key !== 'Escape') return;
      close();
      event.stopImmediatePropagation();
      event.preventDefault();
    },
    true
  );
  addEventListener('wheel', close, { passive: true });
  addEventListener('resize', close);

  window.CANAAN_ITEM_MENU = Object.freeze({
    open,
    openFor,
    close,
    choose,
    isOpen: () => !!box,
    // Les entrées qu'aurait le menu d'une case (tests, manette).
    entriesFor: el => (MENUS[el?.dataset?.menu]?.(el)?.list || []).map(e => e.label)
  });
})();
