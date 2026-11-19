// Carte (touche M) : la grande carte à gauche, et à droite la légende puis la liste des lieux.
// Sur l'île : les six biomes, leur plage de niveaux, leurs donjons et raids ; en donjon : l'instance et ses ennemis.
// Un lieu cliqué dans la liste centre la carte dessus ; survolé, il est entouré sur la carte.
(() => {
  'use strict';
  // Plage de niveaux des monstres d'un biome (ZONE_LEVELS).
  function biomeLevelRange(biome) {
    const [lo, hi] = ZONE_LEVELS[biome];
    return lo + '–' + hi;
  }
  const focusAttrs = (x, y) =>
    ' data-action="mapFocus" data-x="' + Math.round(x) + '" data-y="' + Math.round(y) + '"';
  function instanceLine(d, j) {
    return (
      '<button class="entry map-place" data-map-instance="' +
      j +
      '"' +
      focusAttrs(d.x, d.y) +
      '><span class="' +
      (d.raid ? 'map-raid' : 'map-dungeon') +
      '">' +
      (d.raid ? 'Raid' : 'Donjon') +
      '</span> <span class="map-place-name">' +
      safeGearText(d.name) +
      '</span> <b class="map-ilvl">Niv. ' +
      (d.difficulties
        ? Object.values(d.difficulties)
            .map(mode => mode.level)
            .join(' / ')
        : d.level) +
      '</b></button>'
    );
  }
  // En-tête : titre, et où se trouve le héros.
  function head(title) {
    return (
      '<div class="map-head"><h2>🗺️ ' +
      title +
      '</h2><div class="map-here">📍 <span>Vous êtes ici</span> · <b>' +
      safeGearText(currentZoneName()) +
      '</b></div></div>'
    );
  }
  function layout(side) {
    return (
      '<div class="map-instance-layout"><div class="map-main">' +
      CANAAN_MAP.frame() +
      '</div><div class="map-instance-list">' +
      side +
      '</div></div>'
    );
  }
  // En donjon ou en raid : le plan de l'instance, ses monstres et son boss.
  function instancePanel() {
    const d = instances[game.world.instance.index],
      foes = game.world.monsters.filter(m => m.hp > 0),
      boss = foes.find(m => m.boss);
    return (
      head(safeGearText(d.name)) +
      layout(
        CANAAN_MAP.legend([
          ['me', 'Vous'],
          ['ally', 'Alliés'],
          ['mob', 'Monstres'],
          ['mob', 'Élites', { elite: true }],
          ['bossmob', 'Boss']
        ]) +
          '<section class="island-section"><h4>' +
          (d.raid ? 'Raid' : 'Donjon') +
          '</h4><div class="entry">Ennemis restants : <b>' +
          foes.length +
          '</b></div><div class="entry">' +
          (boss
            ? '👑 ' + safeGearText(boss.t) + ' vous attend.'
            : game.world.instance.cleared
              ? '✅ Instance terminée : ouvre le coffre puis ressors.'
              : '👑 Le boss apparaîtra quand la salle sera vide.') +
          '</div></section>'
      )
    );
  }
  function islandPanel() {
    const here = regionAt(P.x / TS, P.y / TS);
    const regions = ZONES.map((z, i) => {
      const lines = instances
        .map((d, j) => ({ d, j }))
        .filter(v => v.d.biome === i && !v.d.under)
        .map(({ d, j }) => instanceLine(d, j))
        .join('');
      return (
        '<section class="island-section' +
        (z === here ? ' here' : '') +
        '" style="--biome:' +
        CANAAN_MAP.groundColor(z.t) +
        '"><button class="map-region"' +
        focusAttrs(z.x, z.y) +
        '><span class="map-swatch"></span><span class="map-region-name">' +
        safeGearText(z.name) +
        '</span><span class="map-levels">Niveaux ' +
        biomeLevelRange(i) +
        '</span></button>' +
        (z === here ? '<div class="map-here-tag">📍 Vous êtes ici</div>' : '') +
        (i === 0
          ? '<button class="entry map-place"' +
            focusAttrs(CANAAN_CAMP.x, CANAAN_CAMP.y) +
            '><span class="map-camp">Camp</span> <span class="map-place-name">' +
            safeGearText(CANAAN_CAMP.name) +
            '</span> <b class="map-safe">zone sûre</b></button>'
          : '') +
        lines +
        '</section>'
      );
    }).join('');
    return (
      head('Canaan — L’île et ses six biomes') +
      layout(
        CANAAN_MAP.legend([
          ['me', 'Vous'],
          ['camp', 'Camp'],
          ['refuge', 'Refuges'],
          ['portal', 'Donjons'],
          ['portal', 'Raids', { raid: true }],
          ['arena', 'Arène'],
          ['boss', 'Boss mondiaux'],
          ['quest', 'Quête à prendre', { mark: '!' }],
          ['quest', 'Quête à rendre', { mark: '?' }],
          ['target', 'Objectif suivi'],
          ['shop', 'Marchands'],
          ['stairs', 'Entrées des Tréfonds'],
          ['chest', 'Coffres révélés'],
          ['ally', 'Alliés']
        ]) +
          '<h3 class="map-list-title">🧭 Biomes, donjons et raids</h3><p class="muted">Clique un lieu pour le voir sur la carte.</p>' +
          regions
      )
    );
  }
  function toggleMap() {
    if (modalOpen()) {
      closePanels();
      return;
    }
    if (game.world.instance && !game.world.instance.arena) showPanel(instancePanel());
    // Les Tréfonds : leurs quatre biomes, donjons et boss.
    else if (canaanUnder()) showPanel(CANAAN_UNDER.mapPanel());
    else showPanel(islandPanel());
    CANAAN_MAP.open();
  }
  Object.assign(window, { toggleMap });
})();
