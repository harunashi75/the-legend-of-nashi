// ══════ CANAAN CORE: bootstrap, diagnostics et version unique ══════
(() => {
  const CANAAN_VERSION = window.CANAAN_VERSION;
  // Contrats des dépendances obligatoires. Les vérifications restent centralisées ici.
  const CANAAN_REQUIRED_MODULES = Object.freeze([
    { name: 'version', exports: { CANAAN_VERSION: 'string' } },
    {
      name: 'kit graphique',
      exports: {
        canaanOutline: 'function',
        canaanPolish: 'function',
        canaanActorSprite: 'function',
        drawCanaanActor: 'function',
        canaanLight: 'function',
        resetCanaanLights: 'function',
        drawCanaanLighting: 'function',
        drawCanaanBossFrame: 'function',
        drawCanaanChest: 'function'
      }
    },
    {
      name: 'armes et icônes',
      exports: {
        CANAAN_ICONS: 'object',
        CANAAN_ICON_ART: 'object',
        CANAAN_BAG: 'object',
        CANAAN_SHOP: 'object',
        CANAAN_BANK: 'object',
        CANAAN_GATHER: 'object',
        CANAAN_WEAPON_LOOK: 'object',
        CANAAN_SKILL_ICONS: 'object',
        canaanDrawProjectile: 'function'
      }
    },
    {
      name: 'rendu du monde',
      exports: {
        drawWorldTile: 'function',
        worldAmbience: 'function',
        drawWaterRipples: 'function',
        drawWade: 'function',
        windAt: 'function',
        drawWindLayer: 'function'
      }
    },
    {
      name: 'donjons',
      exports: {
        makeDungeon: 'function',
        spawnInstanceBoss: 'function',
        onInstanceBossDown: 'function',
        dungeonChestSpot: 'function',
        drawDungeonTile: 'function',
        drawDungeonGround: 'function',
        drawDungeonDecor: 'function',
        drawDungeonEntrance: 'function',
        dungeonAmbience: 'function',
        dungeonMinimapColor: 'function'
      }
    },
    { name: 'horloge', exports: { 'CANAAN_CLOCK.reset': 'function', 'CANAAN_CLOCK.tickMs': 'number' } },
    {
      name: 'armes',
      exports: {
        CANAAN_WEAPON_DEFENSE: 'function',
        'CanaanStages.weaponEffects.before': 'function',
        'CanaanStages.weaponEffects.after': 'function',
        'CanaanStages.mobScaling.after': 'function',
        'CanaanStages.bossScaling.before': 'function',
        'CanaanStages.weaponVfx.before': 'function',
        'CanaanStages.weaponVfx.after': 'function',
        'CanaanStages.drawWeaponEffects': 'function'
      }
    },
    {
      name: 'statistiques',
      exports: {
        'CANAAN_PROGRESSION.hud': 'function',
        CANAAN_STATS_PREPARE: 'function',
        CANAAN_STATS_ATTACK: 'function',
        CANAAN_STATS_INCOMING: 'function',
        'CANAAN_STATS_VIEW.tooltip': 'function',
        'CANAAN_STATS_VIEW.panel': 'function'
      }
    },
    { name: 'noms des armes', exports: { WEAPON_NAMES: 'object', applyItemName: 'function' } },
    {
      name: 'classes et talents',
      exports: {
        CANAAN_CLASS_STATS: 'function',
        CANAAN_CLASS_DEFENSE: 'function',
        CANAAN_CLASS_MANA_COST: 'function',
        CANAAN_CLASS_CAST: 'function',
        CANAAN_CLASS_BASIC_LOCK: 'function',
        CANAAN_CLASS_ON_DODGE: 'function',
        CANAAN_CLASS_ON_CRIT_TAKEN: 'function',
        CANAAN_CLASS_FATAL: 'function',
        CANAAN_CLASS_PAY: 'function',
        CANAAN_CLASS_CAN_PAY: 'function',
        'CANAAN_CLASS.audit': 'function',
        'CANAAN_CLASS.special': 'function',
        'CANAAN_CLASS_ATTACK.before': 'function',
        'CANAAN_CLASS_ATTACK.after': 'function',
        'CANAAN_CLASS_STATE.export': 'function',
        'CANAAN_CLASS_STATE.import': 'function',
        'CanaanStages.classes.before': 'function',
        'CanaanStages.classes.after': 'function',
        'CanaanStages.drawClassEffects': 'function',
        'CanaanStages.facing.after': 'function',
        canaanApplyHeal: 'function'
      }
    },
    {
      name: 'invocations',
      exports: {
        'CANAAN_SUMMONS.cast': 'function',
        'CANAAN_SUMMONS.syncPact': 'function',
        'CANAAN_SUMMONS.view': 'function',
        'CANAAN_SUMMONS.applyView': 'function',
        'CanaanStages.summons.after': 'function',
        'CanaanStages.drawSummons': 'function'
      }
    },
    {
      name: 'combat',
      exports: {
        'CANAAN_COMBAT.hurt': 'function',
        'CANAAN_COMBAT.dodge': 'function',
        canaanHurtPlayer: 'function',
        canaanDodge: 'function',
        'CanaanStages.dodge.after': 'function',
        'CanaanStages.drawDodge': 'function'
      }
    },
    {
      name: 'attaque de base',
      exports: {
        useSkill: 'function',
        canaanBasicAttack: 'function',
        canaanHoldBasicAttack: 'function',
        'CanaanStages.basicAttack.after': 'function'
      }
    },
    {
      name: 'artéfacts de l’Arène',
      exports: {
        'CANAAN_ARTEFACTS.stats': 'function',
        'CANAAN_ARTEFACTS.attackBefore': 'function',
        'CANAAN_ARTEFACTS.attackAfter': 'function',
        'CANAAN_ARTEFACTS.defense': 'function',
        'CANAAN_ARTEFACTS.beforeHurt': 'function',
        'CANAAN_ARTEFACTS.section': 'function',
        'CANAAN_ARTEFACTS_STATE.export': 'function',
        'CANAAN_ARTEFACTS_STATE.import': 'function',
        'CanaanStages.artefacts.after': 'function',
        equipArtefact: 'function',
        unequipArtefact: 'function',
        toggleArtefact: 'function',
        showArtefactTooltip: 'function',
        drawArtefact: 'function'
      }
    },
    {
      name: 'arène',
      exports: {
        'CANAAN_ARENA.onBossDown': 'function',
        'CANAAN_ARENA.onBossHurt': 'function',
        'CANAAN_ARENA.drawGround': 'function',
        'CANAAN_ARENA.drawAir': 'function',
        'CANAAN_ARENA_STATE.export': 'function',
        'CANAAN_ARENA_STATE.import': 'function',
        'CanaanStages.arena.after': 'function',
        'CanaanStages.drawArenaHud': 'function',
        enterArena: 'function',
        openArenaPortal: 'function',
        arenaLayout: 'function'
      }
    },
    {
      name: 'sac',
      exports: {
        CANAAN_BAG_VIEW: 'function',
        'CANAAN_BAG_STATE.export': 'function',
        'CANAAN_BAG_STATE.import': 'function',
        buyBagUpgrade: 'function'
      }
    },
    {
      name: 'équipement',
      exports: {
        'CANAAN_EQUIPMENT.equip': 'function',
        'CANAAN_EQUIPMENT.unequip': 'function',
        'CANAAN_EQUIPMENT.reserve': 'function',
        'CANAAN_EQUIPMENT.switchWeapon': 'function'
      }
    },
    {
      name: 'interface',
      exports: {
        'CANAAN_UI.openInventory': 'function',
        'CANAAN_UI.openCharacter': 'function',
        'CANAAN_UI.gearStat': 'function',
        'CANAAN_UI.showGearTooltip': 'function',
        'CANAAN_UI.showEquippedTooltip': 'function',
        'CANAAN_UI.inspect': 'function'
      }
    },
    {
      name: 'moteur des objets',
      exports: { 'CANAAN_GEAR_ENGINE.normalize': 'function', 'CANAAN_GEAR_ENGINE.grant': 'function' }
    },
    {
      name: 'objets',
      exports: {
        'CANAAN_GEAR.normalize': 'function',
        'CANAAN_GEAR.normalizeAll': 'function',
        'CANAAN_GEAR.grant': 'function',
        'CANAAN_GEAR.refresh': 'function'
      }
    },
    { name: 'butin', exports: { 'CANAAN_LOOT.grant': 'function', 'CANAAN_LOOT.instance': 'function' } },
    {
      name: 'préférences',
      exports: { 'CANAAN_PREFERENCES.read': 'function', 'CANAAN_PREFERENCES.write': 'function' }
    },
    {
      name: 'audio',
      exports: {
        'CanaanStages.restartMusic': 'function',
        'CanaanStages.stopMusic': 'function',
        'CANAAN_SOUND.floatText': 'function',
        'CANAAN_SOUND.effect': 'function',
        'CANAAN_SOUND.cue': 'function'
      }
    },
    {
      name: 'sauvegarde',
      exports: {
        CANAAN_SAVE_SCHEMA: 'number',
        'CANAAN_PERSISTENCE.snapshot': 'function',
        'CANAAN_PERSISTENCE.freshSnapshot': 'function',
        'CANAAN_PERSISTENCE.restartFresh': 'function',
        'CANAAN_PERSISTENCE.showRecovery': 'function',
        'CANAAN_PERSISTENCE.save': 'function',
        'CANAAN_PERSISTENCE.load': 'function',
        'CANAAN_PERSISTENCE.requestSave': 'function',
        'CANAAN_PERSISTENCE.summary': 'function',
        'CANAAN_PERSISTENCE.createSlot': 'function',
        'CANAAN_PERSISTENCE.deleteSlot': 'function',
        'CANAAN_PERSISTENCE.importLegacy': 'function',
        'CANAAN_SAVE_STORE.read': 'function',
        'CANAAN_SAVE_STORE.write': 'function',
        'CANAAN_SAVE_STORE.remove': 'function'
      }
    },
    {
      name: 'groupe',
      exports: {
        'CANAAN_GROUP.create': 'function',
        'CANAAN_GROUP.exportGuests': 'function',
        'CANAAN_GROUP.importGuests': 'function',
        'CANAAN_GROUP.drawAllies': 'function',
        'CanaanStages.companions.before': 'function',
        toggleGroup: 'function'
      }
    },
    {
      name: 'vie du monde',
      exports: {
        'CANAAN_LIFE.update': 'function',
        'CANAAN_LIFE.drawAnimals': 'function',
        'CANAAN_LIFE.drawVillagers': 'function',
        'CANAAN_LIFE.drawBubbles': 'function'
      }
    },
    {
      name: 'métiers et vie marine',
      exports: {
        'CANAAN_PROF.handle': 'function',
        'CANAAN_PROF.interact': 'function',
        'CANAAN_PROF.sanitize': 'function',
        'CANAAN_PROF.damageMult': 'function',
        'CANAAN_PROF.armorMult': 'function',
        'CANAAN_PROF.speedMult': 'function',
        'CanaanStages.professions.after': 'function',
        'CANAAN_SEA.draw': 'function',
        toggleProfessions: 'function'
      }
    },
    {
      name: 'maison',
      exports: {
        'CANAAN_HOUSE.drawTile': 'function',
        'CANAAN_HOUSE.draw': 'function',
        'CANAAN_HOUSE.interact': 'function'
      }
    },
    {
      name: 'tréfonds',
      exports: {
        'CANAAN_UNDER.setLayer': 'function',
        'CANAAN_UNDER.drawGround': 'function',
        'CANAAN_UNDER.draw': 'function',
        'CANAAN_UNDER.drawSurface': 'function',
        'CANAAN_UNDER.spawn': 'function',
        'CANAAN_UNDER.spawnBosses': 'function',
        'CANAAN_UNDER.blocked': 'function',
        'CANAAN_UNDER.ambience': 'function',
        'CANAAN_UNDER.markers': 'function',
        'CANAAN_UNDER.use': 'function'
      }
    },
    {
      name: 'guide',
      exports: {
        'CANAAN_GUIDE.speaking': 'function',
        'CANAAN_GUIDE.shops': 'function'
      }
    },
    {
      name: 'succès',
      exports: {
        'CANAAN_ACHIEVEMENTS.event': 'function',
        'CANAAN_ACHIEVEMENTS.sanitize': 'function',
        'CANAAN_ACHIEVEMENTS.export': 'function',
        'CANAAN_ACHIEVEMENTS.netView': 'function',
        'CANAAN_ACHIEVEMENTS.applyRemote': 'function',
        'CANAAN_ACHIEVEMENTS.handle': 'function',
        'CANAAN_ACHIEVEMENTS.draw': 'function',
        'CanaanStages.achievements.after': 'function',
        toggleAchievements: 'function'
      }
    },
    {
      name: 'quêtes',
      exports: {
        'CANAAN_QUESTS.interact': 'function',
        'CANAAN_QUESTS.handle': 'function',
        'CANAAN_QUESTS.drawWorld': 'function',
        'CANAAN_QUESTS.exportWorld': 'function',
        'CANAAN_QUESTS.importWorld': 'function',
        'CANAAN_QUESTS.netView': 'function',
        'CANAAN_QUESTS.applyRemote': 'function',
        'CanaanStages.quests.after': 'function',
        'CanaanStages.drawQuests': 'function',
        toggleJournal: 'function'
      }
    },
    {
      name: 'vie du camp',
      exports: {
        'CANAAN_CAMP_LIFE.audit': 'function',
        'CANAAN_CAMP_LIFE.layout': 'function',
        'CANAAN_CAMP_LIFE.items': 'function'
      }
    },
    {
      name: 'échange entre joueurs',
      exports: {
        'CANAAN_TRADE.handle': 'function',
        'CANAAN_TRADE.view': 'function',
        'CANAAN_TRADE.applyRemote': 'function',
        toggleTrade: 'function'
      }
    },
    {
      name: 'réseau',
      exports: {
        'CANAAN_NET.openRoom': 'function',
        'CANAAN_NET.joinRoom': 'function',
        'CANAAN_NET.tick': 'function',
        'CANAAN_NET.applyState': 'function'
      }
    },
    {
      name: 'aventures',
      exports: { 'CANAAN_SLOT_MENU.render': 'function', 'CANAAN_SLOT_MENU.play': 'function' }
    },
    {
      name: 'combat',
      exports: {
        'CANAAN_COMBAT.rawAttack': 'function',
        'CANAAN_COMBAT.attack': 'function',
        'CANAAN_COMBAT.incoming': 'function',
        'CANAAN_COMBAT.heal': 'function'
      }
    }
  ]);
  const CANAAN_REQUIRED_BINDINGS = Object.freeze([
    ['catalogues', 'GEAR_RARITIES', () => GEAR_RARITIES, 'array'],
    ['catalogues', 'WEAPON_TYPES', () => WEAPON_TYPES, 'object'],
    ['catalogues', 'WEAPON_DEFINITIONS', () => WEAPON_DEFINITIONS, 'object'],
    ['catalogues', 'WEAPON_SPELLS', () => WEAPON_SPELLS, 'object'],
    ['catalogues', 'CRAFT_WEAPONS', () => CRAFT_WEAPONS, 'array'],
    ['catalogues', 'ZONE_LEVELS', () => ZONE_LEVELS, 'array'],
    ['butin', 'SOURCE_REWARDS', () => SOURCE_REWARDS, 'object'],
    ['butin', 'grantSourceReward', () => grantSourceReward, 'function'],
    ['instances', 'instanceDifficulty', () => instanceDifficulty, 'function'],
    ['monde', 'world', () => game.world.tiles, 'array'],
    ['monde', 'worldRnd', () => worldRnd, 'function'],
    ['effets', 'visualRnd', () => visualRnd, 'function'],
    ['commandes', 'clearTouchControls', () => clearTouchControls, 'function'],
    ['commandes', 'CanaanStages.updateTouchControls', () => CanaanStages.updateTouchControls, 'function'],
    ['moteur', 'update', () => update, 'function'],
    ['moteur', 'draw', () => draw, 'function'],
    ['moteur', 'recomputeStats', () => recomputeStats, 'function'],
    ['moteur', 'spawnMonsters', () => spawnMonsters, 'function'],
    ['moteur', 'spawnWorldBosses', () => spawnWorldBosses, 'function'],
    ['pipeline', 'CANAAN_PIPELINE', () => CANAAN_PIPELINE, 'object'],
    ['pipeline', 'runUpdatePipeline', () => runUpdatePipeline, 'function'],
    ['pipeline', 'runDrawPipeline', () => runDrawPipeline, 'function'],
    ['armes', 'refreshWeaponBar', () => refreshWeaponBar, 'function'],
    ['objets', 'rarityInfo', () => rarityInfo, 'function'],
    ['sac', 'updateCapacity', () => updateCapacity, 'function'],
    ['interface', 'drawCharacterPreview', () => drawCharacterPreview, 'function'],
    ['sauvegarde', 'saveGame', () => saveGame, 'function'],
    ['sauvegarde', 'loadGame', () => loadGame, 'function']
  ]);
  const CANAAN_MODULES = Object.freeze([
    ...new Set([
      ...CANAAN_REQUIRED_MODULES.map(module => module.name),
      ...CANAAN_REQUIRED_BINDINGS.map(binding => binding[0])
    ])
  ]);
  window.CANAAN_BOOTSTRAP = Object.freeze({
    requiredModules: CANAAN_REQUIRED_MODULES,
    requiredBindings: CANAAN_REQUIRED_BINDINGS,
    validate() {
      const issues = [];
      function check(module, path, read, type) {
        let value;
        try {
          value = read();
        } catch (error) {
          issues.push(module + ' : ' + path + ' inaccessible (' + error.message + ')');
          return;
        }
        const valid =
          type === 'array'
            ? Array.isArray(value)
            : type === 'object'
              ? value !== null && typeof value === 'object'
              : type === 'number'
                ? Number.isFinite(value)
                : type === 'string'
                  ? typeof value === 'string' && value.length > 0
                  : typeof value === type;
        if (!valid)
          issues.push(
            module + ' : ' + path + ' attendu ' + type + ', reçu ' + (value === null ? 'null' : typeof value)
          );
      }
      function readExport(path) {
        let value = window;
        for (const key of path.split('.')) {
          if (value === undefined || value === null) return undefined;
          value = value[key];
        }
        return value;
      }
      for (const module of CANAAN_REQUIRED_MODULES) {
        for (const [path, type] of Object.entries(module.exports))
          check(module.name, path, () => readExport(path), type);
      }
      for (const [module, path, read, type] of CANAAN_REQUIRED_BINDINGS) check(module, path, read, type);
      // Les noms officiels forment une table complète de six raretés × dix familles.
      const rarities = ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
      const weapons = [
        'sword',
        'dualsword',
        'axe',
        'mace',
        'spear',
        'dualdagger',
        'bow',
        'staff',
        'shield',
        'lute'
      ];
      if (window.WEAPON_NAMES && typeof window.WEAPON_NAMES === 'object') {
        for (const rarity of rarities)
          for (const weapon of weapons) {
            const path = 'WEAPON_NAMES.' + rarity + '.' + weapon;
            check('noms des armes', path, () => readExport(path), 'string');
          }
      }
      if (issues.length)
        throw new Error('Dépendances obligatoires manquantes ou invalides :\n- ' + issues.join('\n- '));
      return true;
    }
  });
  window.CANAAN_DEV = Object.freeze({
    version: CANAAN_VERSION,
    modules: CANAAN_MODULES,
    report() {
      CANAAN_BOOTSTRAP.validate();
      const stats = characterStats();
      return {
        version: CANAAN_VERSION,
        started,
        paused,
        player: { hp: P.hp, maxHp: P.mhp, mp: P.mp, gold: P.gold },
        equipmentCount: Object.values(game.hero.equipment).filter(Boolean).length,
        inventoryCount: game.hero.inventory.length,
        level: stats.level,
        stats: { primary: stats.primary, secondary: stats.secondary },
        worldSize: [MAPW, MAPH],
        pipeline: CANAAN_PIPELINE,
        saveSchema: CANAAN_SAVE_SCHEMA,
        clockHz: 60,
        worldSeed: CANAAN_WORLD_SEED,
        saveKey: CANAAN_PERSISTENCE.key,
        combatCore: !!window.CANAAN_COMBAT,
        offensiveCore: !!window.CANAAN_STATS_ATTACK && !!window.CANAAN_CLASS_ATTACK,
        uiCore: !!window.CANAAN_UI,
        gearCore: !!window.CANAAN_GEAR,
        lootCore: !!window.CANAAN_LOOT,
        defensiveCore: !!window.CANAAN_STATS_INCOMING
      };
    },
    selfTest() {
      CANAAN_BOOTSTRAP.validate();
      const checks = {
        canvas: !!document.getElementById('game'),
        world: Array.isArray(game.world.tiles) && game.world.tiles.length === MAPH,
        characterStats: !!characterStats,
        heroStats: !!characterStats().primary && Number.isInteger(game.hero.level),
        update: !!update,
        draw: !!draw,
        save: !!saveGame,
        load: !!loadGame,
        weaponTypes: Object.keys(WEAPON_SPELLS).length === 12 && CRAFT_WEAPONS.length === 10,
        classes: !!window.CANAAN_CLASS,
        talentMenu: !!document.querySelector('#menuButtons button[data-action="toggleTalents"]'),
        talentShortcut: !!toggleTalents,
        offensiveCore: !!window.CANAAN_STATS_ATTACK && !!window.CANAAN_COMBAT.rawAttack,
        sevenClasses:
          !!window.CANAAN_CLASS &&
          window.CANAAN_CLASS.audit().classes === 7 &&
          window.CANAAN_CLASS.audit().talentCount === 70,
        clock: !!window.CANAAN_CLOCK && window.CANAAN_CLOCK.tickMs === 1000 / 60,
        randomStreams: worldRnd !== visualRnd,
        version: window.CANAAN_VERSION === CANAAN_VERSION,
        combatDefense: !!window.CANAAN_STATS_INCOMING && !!window.CANAAN_CLASS_DEFENSE,
        gearCore: !!window.CANAAN_GEAR,
        lootCore: !!window.CANAAN_LOOT,
        gearEngine: !!window.CANAAN_GEAR_ENGINE && !!window.CANAAN_GEAR_ENGINE.normalize,
        weaponNames: !!window.WEAPON_NAMES && !!window.WEAPON_NAMES.Mythique,
        uiFreeze: !!window.CANAAN_UI && !!window.CANAAN_UI.gearStat,
        lootSave: !!window.CANAAN_PERSISTENCE.requestSave
      };
      return {
        version: CANAAN_VERSION,
        checks,
        passed: Object.values(checks).filter(Boolean).length,
        total: Object.keys(checks).length
      };
    }
  });
  // Écran de chargement (template.html, styles/boot-loader.css) : visible dès la première image, il cache le jeu
  // jusqu'à ce que le menu ou le monde soit prêt, puis s'efface en fondu ; il revient avant chaque rechargement.
  window.canaanBootLoader = (() => {
    const el = () => document.getElementById('bootLoader');
    const step = text => {
      const p = document.getElementById('bootStep');
      if (p && typeof text === 'string') p.textContent = text;
    };
    const done = () => {
      const node = el();
      if (!node || !node.classList) return;
      node.classList.add('done');
      setTimeout(() => (node.hidden = true), 500);
    };
    return {
      step,
      done,
      // Quelques images d'abord, pour que le premier dessin soit fait sous le voile.
      doneAfter(frames) {
        if (typeof requestAnimationFrame !== 'function') return done();
        let n = 0;
        const tick = () => (++n >= frames ? done() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      },
      show(text) {
        const node = el();
        if (!node || !node.classList) return;
        node.hidden = false;
        node.classList.remove('done');
        step(text);
      }
    };
  })();
  document.title = 'THE LEGEND OF NASHI V' + CANAAN_VERSION;
  const canaanBootstrapVersionLabel = document.querySelector('#title p');
  if (canaanBootstrapVersionLabel)
    canaanBootstrapVersionLabel.textContent = 'LEGENDS OF THE SHATTERED DAWN · V' + CANAAN_VERSION;
  try {
    window.CANAAN_BOOTSTRAP.validate();
    // Une ancienne partie du navigateur (schéma 9) devient le slot 1, une seule fois.
    CANAAN_PERSISTENCE.importLegacy();
    // Aventure choisie dans le menu avant le rechargement : la charger, sinon afficher le menu.
    const slot = CANAAN_PERSISTENCE.takePending();
    let loaded = false;
    if (slot) {
      canaanBootLoader.step('Ouverture de l’aventure…');
      CANAAN_PERSISTENCE.selectSlot(slot);
      loaded = loadGame();
      if (loaded) CANAAN_PERSISTENCE.sessionBackup();
    }
    if (!loaded) {
      window.CANAAN_GEAR.normalizeAll();
      refreshWeaponBar();
    }
    spawnMonsters(12);
    spawnWorldBosses();
    recomputeStats();
    console.info('[CANAAN ' + CANAAN_VERSION + ']', window.CANAAN_DEV.selfTest());
    window.CANAAN_READY = true;
    loop();
    if (loaded) {
      startGame();
      // L'écran de chargement reste le temps que le monde soit placé et dessiné autour du héros.
      canaanBootLoader.step('Préparation du monde…');
      canaanBootLoader.doneAfter(24);
    } else {
      CANAAN_SLOT_MENU.render();
      canaanBootLoader.doneAfter(2);
    }
  } catch (error) {
    canaanBootLoader.done();
    window.CANAAN_READY = false;
    window.CANAAN_BOOT_ERROR = error.message;
    started = false;
    paused = true;
    console.error('[CANAAN] Erreur au démarrage :', error);
    const title = document.getElementById('title');
    if (title) {
      title.style.display = 'flex';
      const p = title.querySelector('p');
      if (p) {
        p.style.whiteSpace = 'pre-line';
        p.textContent = 'Erreur de chargement : ' + error.message;
      }
      // Aucun slot ne peut être ouvert tant que le jeu n'a pas démarré correctement.
      const menu = document.getElementById('slotMenu');
      if (menu) {
        menu.hidden = true;
        menu.innerHTML = '';
      }
    }
  }
})();
