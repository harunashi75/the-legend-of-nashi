// Carte de l'île (touche M) : les six biomes, leur plage de niveaux, leurs donjons et raids.
(() => {
  'use strict';
  // Plage de niveaux des monstres d'un biome (ZONE_LEVELS).
  function biomeLevelRange(biome) {
    const [lo, hi] = ZONE_LEVELS[biome];
    return lo + '–' + hi;
  }
  function instanceLine(d, j) {
    return (
      '<div class="entry" data-map-instance="' +
      j +
      '"><span class="' +
      (d.raid ? 'map-raid' : 'map-dungeon') +
      '">' +
      (d.raid ? '🟣 Raid' : '🔴 Donjon') +
      '</span> · ' +
      safeGearText(d.name) +
      ' <b class="map-ilvl">Niv. ' +
      (d.difficulties
        ? Object.values(d.difficulties)
            .map(mode => mode.level)
            .join(' / ')
        : d.level) +
      '</b></div>'
    );
  }
  // Barre d'outils : zoom, centrer sur soi, vue d'ensemble ; la molette zoome, la souris fait glisser la carte.
  const TOOLS =
    '<div class="map-tools"><button data-action="mapZoom" data-step="-1" title="Dézoomer">➖</button>' +
    '<button data-action="mapZoom" data-step="1" title="Zoomer">➕</button>' +
    '<button data-action="mapCenter">🎯 Me centrer</button><button data-action="mapFit">🗺️ Vue d’ensemble</button>' +
    '<span id="mapZoomLevel" class="muted"></span><span class="muted map-hint">Molette : zoom · glisser : déplacer · double-clic : zoomer ici</span></div>';
  // En donjon ou en raid : le plan de l'instance, ses monstres et son boss.
  function instancePanel() {
    const d = instances[game.world.instance.index],
      foes = game.world.monsters.filter(m => m.hp > 0),
      boss = foes.find(m => m.boss);
    return (
      '<h2>🗺️ ' +
      safeGearText(d.name) +
      '</h2><p class="muted">⚪ Vous · 🔵 Alliés · 🔴 Monstres · 🟠 Élites · 👑 Boss</p><div class="map-instance-layout"><div>' +
      TOOLS +
      '<canvas id="bigMap" width="800" height="800"></canvas></div><div class="map-instance-list"><h3>' +
      (d.raid ? '🟣 Raid' : '🔴 Donjon') +
      '</h3><section class="island-section"><div class="entry">Ennemis restants : <b>' +
      foes.length +
      '</b></div><div class="entry">' +
      (boss
        ? '👑 ' + safeGearText(boss.t) + ' vous attend.'
        : game.world.instance.cleared
          ? '✅ Instance terminée : ouvre le coffre puis ressors.'
          : '👑 Le boss apparaîtra quand la salle sera vide.') +
      '</div></section></div></div>'
    );
  }
  function toggleMap() {
    if (modalOpen()) {
      closePanels();
      return;
    }
    if (game.world.instance && !game.world.instance.arena) {
      showPanel(instancePanel());
      CANAAN_MAP.open();
      return;
    }
    // Les Tréfonds : leurs quatre biomes, donjons et boss.
    if (canaanUnder()) {
      showPanel(CANAAN_UNDER.mapPanel());
      CANAAN_MAP.open();
      return;
    }
    const regions = ZONES.map((z, i) => {
      const lines = instances
        .map((d, j) => ({ d, j }))
        .filter(v => v.d.biome === i)
        .map(({ d, j }) => instanceLine(d, j))
        .join('');
      return (
        '<section class="island-section"><h4>' +
        (i + 1) +
        '. ' +
        safeGearText(z.name) +
        '</h4><div class="muted">Niveaux ' +
        biomeLevelRange(i) +
        '</div>' +
        (i === 0 ? '<div class="muted">🏕️ ' + safeGearText(CANAAN_CAMP.name) + ' · zone sûre</div>' : '') +
        lines +
        '</section>'
      );
    }).join('');
    showPanel(
      '<h2>🗺️ Canaan — L’île et ses six biomes</h2><p class="muted">🏕️ Camp · 🔴 Donjons · 🟣 Raids · 🔶 Arène · ⭐ Boss mondiaux · 🏠 Ta maison · 🛖 Refuges · ❗ Quête à prendre · ❓ Quête à rendre · 🎯 Objectif suivi · ⚪ Vous</p><div class="map-instance-layout"><div>' +
        TOOLS +
        '<canvas id="bigMap" width="800" height="800"></canvas></div><div class="map-instance-list"><h3>🧭 Biomes, donjons et raids</h3><p class="muted">Survole une instance pour la voir sur la carte.</p>' +
        regions +
        '</div></div>'
    );
    CANAAN_MAP.open();
  }
  Object.assign(window, { toggleMap });
})();
