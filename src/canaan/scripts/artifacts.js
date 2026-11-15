(() => {
  'use strict';
  const ART = {
    0: { icon: '⟦art_ardeur⟧', name: 'Ardeur', desc: 'Dégâts infligés et soins prodigués' },
    1: { icon: '⟦art_bastion⟧', name: 'Bastion', desc: 'Points de vie maximum et réduction des dégâts reçus' },
    2: { icon: '⟦art_instinct⟧', name: 'Instinct', desc: 'Chance de critique et vitesse de déplacement' }
  };
  function passive(it) {
    if (!it || it.slot !== 'artifact') return null;
    ensureArtifact(it);
    const variant = it.artifactVariant,
      kind = ART[variant] || ART[0];
    const amount = artifactPower(it);
    return { ...kind, variant, amount };
  }
  function passiveText(it) {
    const p = passive(it);
    if (!p) return '';
    if (p.variant === 0)
      return p.icon + ' ' + p.name + ' — Dégâts +' + p.amount + ' % · Soins +' + p.amount + ' %';
    if (p.variant === 1)
      return p.icon + ' ' + p.name + ' — PV max +' + p.amount + ' % · Dégâts reçus −' + p.amount + ' %';
    return (
      p.icon + ' ' + p.name + ' — Chance critique +' + p.amount + ' points · Vitesse +' + p.amount + ' %'
    );
  }
  // Les artéfacts n'ont pas de points Ratings52 : seul leur passif modifie les statistiques.
  window.CANAAN_ARTIFACT_STATS = function (s, hero = game.hero) {
    const p = passive(hero.equipment.artifact);
    if (!p) return s;
    if (p.variant === 0) s.artifactHealingBonus = p.amount / 100;
    else if (p.variant === 1) s.maxHp = Math.round(s.maxHp * (1 + p.amount / 100));
    else if (p.variant === 2) {
      s.crit = Math.min(60, +(s.crit + p.amount).toFixed(1));
      s.speed = Math.min(60, Math.max(0, Number(s.speed) || 0) + p.amount);
    }
    return s;
  };
  window.CANAAN_ARTIFACT_PASSIVE = (hero = game.hero) => passive(hero.equipment.artifact);

  function tooltip(it) {
    const p = passive(it),
      rar = rarityInfo(it);
    return (
      '<div class="tooltip-name" style="color:' +
      rar.color +
      '">' +
      safeGearText(it.name) +
      '</div>' +
      '<div class="tooltip-sub">🔮 Artefact · ' +
      safeGearText(rar.name) +
      ' · Niveau ' +
      itemLevel(it) +
      '</div>' +
      '<div class="artifact56"><b>' +
      p.icon +
      ' PASSIF : ' +
      p.name +
      '</b><div>' +
      safeGearText(passiveText(it)) +
      '</div><div>Sans statistiques principales ni secondaires.</div></div>'
    );
  }

  function compare(it, worn) {
    const a = passiveText(it),
      b = worn?.slot === 'artifact' ? passiveText(worn) : 'Aucun artefact équipé';
    return (
      '<div class="artifact56-compare"><b>🔮 Comparaison des passifs</b><div>Actuel : ' +
      safeGearText(b) +
      '</div><div>Nouveau : ' +
      safeGearText(a) +
      '</div><small>Aucun point de statistique : seul le passif est actif.</small></div>'
    );
  }
  window.CANAAN_ARTIFACT_UI = Object.freeze({ stat: passiveText, compare, tooltip });
})();
