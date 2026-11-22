// Niveau des monstres : dehors, celui du héros borné à la plage de sa zone (Plaines verdoyantes 1–10 … Forêt
// enchantée 50–60) ; en instance, celui de l'instance ; pour un boss, le sien. Ses PV et ses dégâts en découlent
// (shared/rules/stats.js) ; rien ne s'adapte à l'équipement du héros.
(() => {
  // Zone (0 à 5) d'une case de l'île.
  function zoneIndexAt(tx, ty) {
    return Math.max(0, ZONES.indexOf(regionAt(tx, ty)));
  }
  // Niveau d'un monstre de l'île à la case (tx, ty) : celui de l'hôte, borné à la plage de la zone.
  function zoneMobLevel(tx, ty) {
    return clampLevel(zoneLevel(zoneIndexAt(tx, ty), game.hero?.level));
  }
  // Un monstre de l'île encore intact suit le niveau du héros quand celui-ci progresse (jusqu'au plafond de la zone) ;
  // un monstre blessé garde le sien jusqu'à la fin du combat. L'hôte décide, les invités reçoivent son état.
  function followHeroLevel(m) {
    if (!m.zoneMob || m.hp <= 0 || m.hp < m.mhp) return;
    const level = zoneMobLevel(m.x / TS, m.y / TS);
    if (level === m.level) return;
    const type = canaanMobTypes().find(t => t.name === m.t);
    m.level = level;
    m.mhp = m.hp = mobHealth(level, !!m.elite, type?.hp || 100);
    m.g = mobGold(level, !!m.elite);
  }
  // Instance en cours : niveau de ses ennemis (et de ses boss, un peu plus haut).
  function instanceLevel(boss = false) {
    const inst = game.world.instance;
    if (!inst) return null;
    if (inst.arena) return clampLevel(game.hero?.level);
    // Donjon des Tréfonds : au niveau du groupe, fixé à l'entrée.
    if (Number.isFinite(inst.scaledLevel)) return clampLevel(inst.scaledLevel + (boss ? 1 : 0));
    const d = instances[inst.index],
      mode = instanceDifficulty();
    return clampLevel((mode?.mobLevel || d?.mobLevel || 1) + (boss ? (d?.raid ? 2 : 1) : 0));
  }
  // Niveau d'un monstre : fixé à sa création ; sinon celui de son instance, de son boss ou de sa zone.
  function mobLevel(m) {
    if (!m) return 1;
    if (!Number.isFinite(m.level)) {
      if (m.worldBoss) m.level = WORLD_BOSSES.find(b => b.id === m.worldBossId)?.level || m.bossLevel || 1;
      else if (game.world.instance) m.level = instanceLevel(!!m.boss);
      else m.level = zoneMobLevel(m.x / TS, m.y / TS);
    }
    return clampLevel(m.level);
  }
  function bossTier(m) {
    const dungeon = game.world.instance ? instances[game.world.instance.index] : null;
    return { raid: !!(m.boss && dungeon?.raid), level: mobLevel(m) };
  }
  // PV d'un boss : selon son niveau et son type, avec la difficulté et la taille du groupe en instance.
  function bossMaxHealth(m) {
    const { raid, level } = bossTier(m);
    if (m.worldBoss) return bossHealth(level, 'world');
    return Math.round(
      bossHealth(level, raid ? 'raid' : 'dungeon') * (instanceDifficulty()?.hp || 1) * canaanGroupScale().hp
    );
  }
  function scaleBossHp(m) {
    // Les boss de l'Arène ont des PV fixes.
    // Ni ceux d'une extension qui règle elle-même leurs PV (customHp : selon le nombre de participants).
    if (!m || m.hp <= 0 || !(m.boss || m.worldBoss) || m.arenaBoss || m.customHp) return;
    const desired = bossMaxHealth(m);
    if (m._scaledMaxHp === desired) return;
    const ratio = m.mhp > 0 ? Math.min(1, Math.max(0, m.hp / m.mhp)) : 1;
    m.mhp = desired;
    m.hp = Math.max(1, Math.round(desired * ratio));
    m._scaledMaxHp = desired;
  }
  const INSTANCE_TOUGHNESS = 1.25;
  // Monstre ordinaire : PV fixés une fois, d'après son niveau (élite ×2,4), son espèce, et en instance la difficulté
  // et la taille du groupe. Un monstre déjà blessé garde sa part de PV.
  function setupMob(m) {
    if (!m || m.boss || m.worldBoss || m.arenaBoss || m.arenaClone || m.hp <= 0 || m._levelHp) return;
    const type = canaanMobTypes().find(t => t.name === m.t),
      inst = game.world.instance && !game.world.instance.arena,
      // En donjon et en raid, les monstres sont 25 % plus résistants que dehors (boss : voir bossHealth).
      scale = inst ? INSTANCE_TOUGHNESS * (instanceDifficulty()?.hp || 1) * canaanGroupScale().hp : 1,
      // Une élite d'instance a 1,6× les PV d'un monstre (×2,4 dehors) : jamais autant qu'un boss.
      eliteScale = inst && m.elite ? 1.6 / 2.4 : 1,
      desired = Math.round(mobHealth(mobLevel(m), !!m.elite, type?.hp || 100) * scale * eliteScale),
      ratio = m.mhp > 0 ? Math.min(1, Math.max(0, m.hp / m.mhp)) : 1;
    m.mhp = desired;
    m.hp = Math.max(1, Math.round(desired * ratio));
    m._levelHp = true;
  }
  // Étapes du pipeline : monstres et boss réglés sur leur niveau (les nouveaux venus, toutes les 45 mises à jour).
  let hpClock = 0;
  window.CanaanStages.bossScaling = {
    before() {
      if (++hpClock % 45 === 0) for (const m of game.world.monsters) scaleBossHp(m);
    }
  };
  let levelClock = 0;
  window.CanaanStages.mobScaling = {
    after() {
      for (const m of game.world.monsters) if (!m._levelHp) setupMob(m);
      if (game.mode !== 'guest' && !game.world.instance && ++levelClock % 60 === 0)
        for (const m of game.world.monsters) followHeroLevel(m);
    }
  };
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    bossTier,
    scaleBossHp,
    canaanMobLevel: mobLevel,
    canaanSetupMob: setupMob,
    canaanZoneIndexAt: zoneIndexAt,
    canaanZoneMobLevel: zoneMobLevel
  });
})();
