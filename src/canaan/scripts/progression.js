// Progression du personnage : niveau 1 à 60 et expérience (hero.level, hero.exp, sauvegardés).
// XP gagnée en combattant (monstres, élites, boss mondiaux, boss d'instance) et en terminant un donjon ou un raid ;
// les premiers niveaux vont très vite, puis la progression ralentit (shared/rules/stats.js : xpToNext).
// L'hôte décide : un invité reçoit son niveau et son XP dans son message privé.
(() => {
  'use strict';
  // Héros qui partagent une victoire : le vainqueur et ses alliés vivants à proximité (même instance ou même monde).
  const SHARE = 18 * TS;
  function sharers(at, killer) {
    return game.heroes.filter(
      h =>
        h === killer ||
        (!h.away && !h.player.dead && Math.hypot(h.player.x - at.x, h.player.y - at.y) < SHARE)
    );
  }
  // Donne de l'XP à un héros ; une montée de niveau rend tous les PV et le mana et est annoncée.
  function grantXp(hero, amount, at = null) {
    if (!hero || amount <= 0 || clampLevel(hero.level) >= MAX_LEVEL) return 0;
    const gained = addXp(hero, amount);
    if (at && hero === game.hero) float(at.x, at.y - 70, '+' + Math.round(amount) + ' XP', '#c9a6ff');
    if (gained) levelUp(hero);
    return gained;
  }
  function levelUp(hero) {
    recomputeHeroStats(hero);
    hero.player.hp = hero.player.mhp;
    hero.player.mp = hero.player.mmp;
    const text =
      '⭐ Niveau ' + hero.level + ' !' + (hero.level >= MAX_LEVEL ? ' Niveau maximum atteint.' : '');
    canaanLootNotice(hero, text);
    if (hero === game.hero) {
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 40);
      CANAAN_SOUND.cue('levelup');
      chat('Système', text);
    }
    // Nouvel emplacement de talent aux niveaux 10, 20, 30 et 40.
    CANAAN_CLASS.onLevel(hero);
    window.CANAAN_PERSISTENCE.requestSave();
  }
  // XP d'une victoire, partagée par les héros présents : chacun selon son propre niveau.
  function killXp(m, killer = game.hero) {
    if (!m || game.world.instance?.arena) return;
    const level = canaanMobLevel(m);
    for (const hero of sharers(m, killer)) {
      const lv = clampLevel(hero.level),
        amount = m.worldBoss
          ? bossXp(level, 'world')
          : m.boss
            ? bossXp(level, bossTier(m).raid ? 'raid' : 'dungeon')
            : // Dans un donjon ou un raid, les monstres ordinaires rapportent moins (le boss et le coffre comptent).
              Math.round(mobXp(level, lv, !!m.elite) * (game.world.instance ? 0.6 : 1));
      grantXp(hero, amount, m);
    }
  }
  // Instance terminée (coffre du boss ouvert) : grosse récompense pour chaque héros du groupe.
  function clearInstanceXp(index, hero) {
    const d = instances[index];
    if (!d) return 0;
    const mode = instanceDifficulty(),
      level = game.world.instance?.scaledLevel || mode?.mobLevel || d.mobLevel || 1;
    return grantXp(hero, clearXp(level, !!d.raid), hero.player);
  }
  // Barre d'XP et niveau de l'affichage tête haute.
  function hud() {
    const hero = game.hero,
      lv = clampLevel(hero.level),
      need = xpToNext(lv),
      bar = document.getElementById('xpb'),
      text = document.getElementById('xpt');
    document.getElementById('plevel').textContent = 'Niv. ' + lv;
    if (bar) bar.style.width = (need ? Math.min(100, (100 * (hero.exp || 0)) / need) : 100) + '%';
    if (text) text.textContent = need ? (hero.exp || 0) + ' / ' + need + ' XP' : 'Niveau maximum';
  }
  window.CANAAN_PROGRESSION = Object.freeze({ grantXp, killXp, clearInstanceXp, hud });
  Object.assign(window, { canaanKillXp: killXp, canaanGrantXp: grantXp });
})();
