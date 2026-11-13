const weaponCooldowns = {};
let activeWeaponType = '';
let spellZones = [];
let spellHits = [];
function currentWeaponType() {
  return game.hero.equipment.weapon?.weaponType || 'sword';
}
function refreshWeaponBar() {
  const type = currentWeaponType();
  activeWeaponType = type;
  skEl.innerHTML = '';
  SKILLS.length = 0;
  WEAPON_SPELLS[type].forEach((spec, i) => {
    const key = type + ':' + i;
    const skill = {
      n: spec[1],
      k: String(i + 1),
      icon: spec[0],
      cd: weaponCooldowns[key] || 0,
      max: spec[3],
      mp: spec[4]
    };
    SKILLS.push(skill);
    const el = document.createElement('div');
    el.className = 'skill';
    el.title = spec[1] + ' — ' + spec[2] + ' (Mana ' + spec[4] + ', recharge ' + spec[3] + ' s)';
    el.innerHTML =
      spec[0] +
      '<span class="skill-label">' +
      spec[1] +
      '</span><div class="key">' +
      (i + 1) +
      '</div><div class="cd" style="display:none"></div>';
    el.dataset.skill = i;
    skEl.appendChild(el);
    skill.el = el;
  });
  // Élément de la classe sur chaque compétence, et la case du sort spécial (F).
  CANAAN_CLASS.decorateSkillBar(skEl);
}

function facingAngleCore() {
  if (Math.hypot(mouseWorldX - P.x, mouseWorldY - P.y) > 25)
    return Math.atan2(mouseWorldY - P.y, mouseWorldX - P.x);
  return P.face === -1 ? Math.PI : 0;
}
function applyEffect(m, key, seconds, value = 1) {
  m['spell_' + key] = Math.max(m['spell_' + key] || 0, seconds);
  if (key === 'bleed') m.spell_bleedPower = Math.max(m.spell_bleedPower || 0, value);
}

// Étape du pipeline : effets des sorts d'armes sur les monstres.
window.CanaanStages.weaponEffects = {
  // Avant l'IA : mémoriser les positions pour que l'immobilisation empêche réellement la poursuite.
  before() {
    const originalPositions = new Map();
    for (const m of game.world.monsters) {
      if (m.spell_stun > 0 || m.spell_root > 0 || m.spell_slow > 0)
        originalPositions.set(m, {
          x: m.x,
          y: m.y,
          stun: m.spell_stun > 0,
          root: m.spell_root > 0,
          slow: m.spell_slow > 0
        });
    }
    return originalPositions;
  },
  after(originalPositions) {
    if (!started || paused) return;
    for (const [m, prev] of originalPositions) {
      if (!game.world.monsters.includes(m)) continue;
      if (prev.stun || prev.root) {
        m.x = prev.x;
        m.y = prev.y;
      } else if (prev.slow) {
        m.x = prev.x + (m.x - prev.x) * 0.45;
        m.y = prev.y + (m.y - prev.y) * 0.45;
      }
      if (prev.stun) m.cd = Math.max(m.cd, 0.1);
    }
    for (const m of game.world.monsters.slice()) {
      for (const k of ['stun', 'root', 'slow', 'bleed', 'vulnerable']) {
        const field = 'spell_' + k;
        if (m[field] > 0) m[field] = Math.max(0, m[field] - 1 / 60);
      }
      if (m.spell_bleed > 0) {
        m.spell_bleedTick = (m.spell_bleedTick || 0) + 1 / 60;
        if (m.spell_bleedTick >= 1) {
          m.spell_bleedTick -= 1;
          hit(m, m.spell_bleedPower || 4);
        }
      }
    }
    for (const z of spellZones) {
      z.time -= 1 / 60;
      z.tick -= 1 / 60;
      if (z.tick <= 0) {
        z.tick = 0.5;
        game.world.monsters.slice().forEach(m => {
          if (Math.hypot(m.x - z.x, m.y - z.y) < z.r) hit(m, z.dmg);
        });
        burst(z.x, z.y, '#c38e58', 5);
      }
    }
    spellZones = spellZones.filter(z => z.time > 0);
    for (const task of spellHits) {
      task.delay -= 1 / 60;
      if (task.delay <= 0) task.action();
    }
    spellHits = spellHits.filter(t => t.delay > 0);
    for (const key of Object.keys(weaponCooldowns))
      weaponCooldowns[key] = Math.max(0, weaponCooldowns[key] - 1 / 60);
    SKILLS.forEach((s, i) => (s.cd = weaponCooldowns[activeWeaponType + ':' + i] || 0));
  }
};
// Fin des effets d'armes. Les PV des monstres viennent de leur niveau (monster-scaling.js).
