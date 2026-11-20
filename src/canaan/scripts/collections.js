'use strict';
// Collections (touche V), comme dans les grands MMO : tout ce que le héros collectionne, réuni dans une seule fenêtre
// à onglets. D’abord les onglets des extensions, puis la Garde-robe (wardrobe.js), le
// Bestiaire (achievements.js) et les Fouilles (digging.js). L'onglet choisi est gardé d'une ouverture à l'autre.
// Une extension ajoute ses onglets par collectionTabs() : [{ id, label, count, section() }] (voir extensions.js).
const CANAAN_COLLECTIONS = (() => {
  const own = () => [
    {
      id: 'wardrobe',
      label: '👗 Garde-robe',
      count: CANAAN_WARDROBE.count() + ' / ' + SKINS.length,
      section: () => CANAAN_WARDROBE.section()
    },
    {
      id: 'bestiary',
      label: '📖 Bestiaire',
      count: CANAAN_ACHIEVEMENTS.bestiaryCount(game.hero),
      section: () => '<div class="ach-scroll">' + CANAAN_ACHIEVEMENTS.bestiary(game.hero) + '</div>'
    },
    {
      id: 'digging',
      label: '⟦tool_shovel⟧ Fouilles',
      section: () => '<div class="ach-scroll">' + CANAAN_DIG.tab(game.hero) + '</div>'
    }
  ];
  const tabs = () => [...CANAAN_EXT.collectionTabs(), ...own()];
  let tab = null; // onglet affiché (null : le premier)
  const win = () => document.getElementById('window');
  const isOpen = () => modalOpen() && win()?.dataset.canaanPanel === 'collections';
  const current = () => (isOpen() ? tab : null);
  // Ce qui change l'affichage sans clic (une apparence obtenue, une créature croisée, un trésor déterré…) : la
  // fenêtre ouverte est redessinée quand cette empreinte change.
  let shown = '';
  const signature = () =>
    JSON.stringify([tab, tabs().map(t => t.count), tab === 'digging' ? CANAAN_DIG.signature(game.hero) : '']);
  function render() {
    const list = tabs();
    if (!list.some(t => t.id === tab)) tab = list[0].id;
    const at = list.find(t => t.id === tab);
    hideGearTooltip();
    shown = signature();
    showPanel(
      '<div class="collections-panel">' +
        canaanHead('⟦menu_collections⟧ Collections') +
        canaanTabs(
          'collectionsTab',
          tab,
          list.map(t => [t.id, t.label, t.count])
        ) +
        at.section() +
        '</div>'
    );
    win().dataset.canaanPanel = 'collections';
  }
  // Ouvre (ou redessine) la fenêtre sur un onglet ; un onglet inconnu garde le précédent.
  function open(id) {
    if (id && tabs().some(t => t.id === id)) tab = id;
    render();
  }
  // V : ouvre les collections, ou les referme si elles sont affichées.
  function toggle() {
    if (!started || paused) return;
    if (modalOpen()) {
      const mine = isOpen();
      closePanels();
      if (mine) return;
    }
    render();
  }
  setInterval(() => {
    if (typeof started !== 'undefined' && started && isOpen() && signature() !== shown) render();
  }, 500);
  return Object.freeze({ open, render, toggle, isOpen, current, tabs: () => tabs().map(t => t.id) });
})();
window.CANAAN_COLLECTIONS = CANAAN_COLLECTIONS;
Object.assign(window, {
  toggleCollections: CANAAN_COLLECTIONS.toggle,
  canaanCollections: CANAAN_COLLECTIONS.open
});
