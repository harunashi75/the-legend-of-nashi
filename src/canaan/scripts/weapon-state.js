const weaponCooldowns = {};
let activeWeaponType = '';
let spellZones = [];
let spellHits = [];
// Jeu de compétences actif du héros de l'hôte : celui de l'arme de sa classe, ou du félin quand le Druide est en
// forme féline ; '' sans classe (aucune compétence, l'attaque de base frappe à mains nues).
function currentWeaponType() {
  return typeof CANAAN_CLASS === 'undefined'
    ? game.hero.equipment.weapon?.weaponType || ''
    : CANAAN_CLASS.weaponType(game.hero);
}
function refreshWeaponBar() {
  const type = currentWeaponType();
  activeWeaponType = type;
  skEl.innerHTML = '';
  SKILLS.length = 0;
  (WEAPON_SPELLS[type] || []).forEach((spec, i) => {
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
    el.innerHTML =
      CANAAN_SKILL_ICONS.weapon(type, i) +
      '<span class="skill-label">' +
      spec[1] +
      '</span><div class="key" data-pad="' +
      ['X', 'Y', 'LB', 'RB'][i] +
      '">' +
      // Touche choisie dans les Paramètres → Clavier.
      CANAAN_KEYS.labelOf('skill' + (i + 1)).replace(/[&<>]/g, c => '&#' + c.charCodeAt(0) + ';') +
      '</div><div class="skill-badge" hidden></div><div class="cd" style="display:none"></div>';
    el.dataset.skill = i;
    el.dataset.tooltipSkill = i;
    skEl.appendChild(el);
    skill.el = el;
  });
  // Élément de la classe sur chaque compétence, et la case du sort spécial (F).
  CANAAN_CLASS.decorateSkillBar(skEl);
}

// ---------------------------------------------------------------- Info-bulle et état des compétences
// États des postures et charges du héros affiché : ceux de la simulation pour l'hôte, ceux reçus de l'hôte pour un invité.
let canaanGuestStance = null;
function canaanStanceOf() {
  if (game.mode === 'guest') return canaanGuestStance || {};
  return typeof CANAAN_SKILLS === 'undefined' ? {} : CANAAN_SKILLS.state(game.hero);
}
// Petit badge d'une case de compétence : posture en cours (secondes), bonus prêt, ou charges arcaniques.
function canaanSkillBadge(type, i, st) {
  const sec = v => (v > 0 ? Math.ceil(v) + ' s' : '');
  // Postures en cours sur la compétence qui les lance et sur la frappe qu'elles renforcent.
  const posture = { greataxe: 'berserk', feline: 'roar', aegis: 'shieldGuard' }[type];
  if (i === 2 && posture && st[posture] > 0) return { text: sec(st[posture]), on: true };
  if (type === 'greataxe' && i === 3 && st.berserk > 0) return { text: sec(st.berserk), on: true };
  if (type === 'dualdagger' && i === 1 && st.shadow > 0) return { text: sec(st.shadow), on: true };
  if (type === 'dualsword' && i === 3 && st.combo > 0) return { text: 'COMBO', on: true };
  if (type === 'bow' && i === 1 && st.huntMark > 0) return { text: sec(st.huntMark), on: true };
  if (type === 'wildstaff' && i === 1 && st.bloom > 0) return { text: sec(st.bloom), on: true };
  return null;
}
function canaanUpdateSkillBadges() {
  const st = canaanStanceOf(),
    type = activeWeaponType;
  SKILLS.forEach((s, i) => {
    const b = canaanSkillBadge(type, i, st),
      key = b ? b.text + (b.on ? '!' : '') : '';
    if (s.badgeKey === key) return;
    s.badgeKey = key;
    const el = s.el?.querySelector?.('.skill-badge');
    if (!el) return;
    el.hidden = !b;
    el.textContent = b ? b.text : '';
    s.el.classList?.toggle('skill-boosted', !!b?.on);
  });
}
// Info-bulle d'une compétence (survol de la barre) : explication, dégâts estimés avec la puissance actuelle,
// recharge et mana, effet de la classe et état en cours (charges, bonus prêts).
function canaanSkillTooltip(i) {
  const esc = v =>
    String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  if (i === 'special') {
    const c = classById(game.hero.classe?.id);
    if (!c) return '';
    return (
      '<div class="tooltip-name skill-tip-head" style="color:' +
      c.color +
      '"><span class="skill-tip-icon">' +
      (CANAAN_SKILL_ICONS.special(c.special.id) || c.special.icon) +
      '</span>' +
      esc(c.special.name) +
      '</div>' +
      '<div class="tooltip-sub">Sort de classe · touche F · ' +
      esc(c.name) +
      '</div>' +
      '<div class="skill-tip-desc">' +
      esc(c.special.desc) +
      '</div>' +
      '<div class="skill-tip-meta">' +
      (c.special.mana > 0
        ? RESOURCES[CANAAN_CLASS.resource(game.hero)].name + ' ' + CANAAN_CLASS.specialPrice(game.hero)
        : 'Sans coût') +
      ' · recharge ' +
      c.special.cooldown +
      ' s</div>'
    );
  }
  const type = currentWeaponType(),
    weapon = WEAPON_DEFINITIONS[type],
    spec = weapon?.sp?.[i];
  if (!spec) return '';
  const [icon, name, summary, cd, mana, mult, detail] = spec,
    offensive = isOffensiveSkill(type, i),
    magic = MAGIC_WEAPONS.includes(type),
    // Invocations : la puissance est celle d'un coup de la créature (ou d'une seconde de zone du totem).
    summon = type === 'grimoire',
    st = canaanStanceOf();
  let lines =
    '<div class="tooltip-name skill-tip-head"><span class="skill-tip-icon">' +
    (CANAAN_SKILL_ICONS.weapon(type, i) || icon) +
    '</span>' +
    esc(name) +
    '</div>' +
    '<div class="tooltip-sub">' +
    esc(
      tt('Compétence {n} · {arme} · {genre}', {
        n: i + 1,
        arme: tt(weapon.name),
        genre: tt(summon ? 'invocation' : offensive ? 'offensive' : 'utilitaire')
      })
    ) +
    '</div>' +
    '<div class="skill-tip-desc">' +
    esc(detail || summary) +
    '</div>';
  if (mult > 0 && typeof CANAAN_SKILLS !== 'undefined') {
    const power = CANAAN_SKILLS.power(game.hero, magic);
    let estimate = '{n} dégâts de base par cible';
    if (summon) estimate = i === 2 ? '{n} dégâts par seconde' : '{n} dégâts par coup';
    else if (type === 'dualdagger' && i === 2) estimate = '{n} dégâts de base par dague';
    else if (type === 'staff' && (i === 0 || i === 2))
      estimate = '{n} dégâts de base sur la cible principale';
    else if (type === 'wildstaff' && i === 2) estimate = '{n} dégâts de base sur toute la durée';
    else if (
      (type === 'wildstaff' && i === 3) ||
      (type === 'feline' && i === 0) ||
      (type === 'dualdagger' && (i === 0 || i === 3)) ||
      (type === 'lute' && i === 3) ||
      (type === 'bow' && i >= 2) ||
      (type === 'dualsword' && i <= 1)
    )
      estimate = '{n} dégâts de base si tous les coups touchent';
    lines +=
      '<div class="skill-tip-dmg">≈ ' +
      tt(estimate, { n: Math.round(power * mult) }) +
      ' · ' +
      tt(magic ? '{n} % de ta Puissance magique ({m})' : '{n} % de ta Puissance ({m})', {
        n: Math.round(mult * 100),
        m: power
      }) +
      '</div>';
  }
  // Coût dans la ressource de la classe (converti selon son niveau) ; le Berserker paie en PV (Soif de sang), selon
  // ses PV max et son niveau.
  const blood = CANAAN_CLASS.bloodCost(game.hero, mana),
    kind = CANAAN_CLASS.resource(game.hero),
    cost = Math.round(window.CANAAN_CLASS_MANA_COST(type, i, mana));
  lines +=
    '<div class="skill-tip-meta">' +
    (blood !== null
      ? tt('Recharge {n} s · {m} PV', { n: cd, m: blood })
      : tt('Recharge {n} s · ' + RESOURCES[kind].name + ' {m}', { n: cd, m: cost })) +
    '</div>';
  const rider = CANAAN_CLASS.skillRider(type, i, game.hero);
  if (rider) lines += '<div class="skill-tip-class">' + esc(rider) + '</div>';
  for (const [talent, bonus] of CANAAN_CLASS.skillTalents(type, i))
    lines += '<div class="skill-tip-talent"><b>' + esc(tt(talent)) + '</b> · ' + esc(tt(bonus)) + '</div>';
  const badge = canaanSkillBadge(type, i, st);
  if (badge?.on)
    lines +=
      '<div class="skill-tip-state">✦ ' + esc(tt('Bonus prêt : {nom}', { nom: tt(badge.text) })) + '</div>';
  return lines;
}
function showSkillTooltip(i, event) {
  const html = canaanSkillTooltip(i === 'special' ? 'special' : Number(i));
  if (!html) return;
  gearTooltip.innerHTML = html;
  gearTooltip.style.display = 'block';
  moveGearTooltip(event);
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
