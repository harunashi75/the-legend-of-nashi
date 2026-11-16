// Métiers (touche P) : pêche et cuisine, chacune avec ses niveaux (1 à 40).
// Pêche : dans l'eau profonde (mer, lacs, lacs scintillants ; pas l'eau peu profonde du marais), près d'un banc
// de poissons (remous). E lance la ligne ; quand ça mord, E ferre le poisson. Espèce selon l'eau et le biome,
// qualité (les mêmes que l'équipement) selon le niveau de pêche.
// Cuisine : près d'une cuisinière (La Marmite dorée au camp, refuges, maison), un poisson donne un repas de sa recette ; la qualité
// du repas est celle du poisson, plafonnée par le niveau de cuisine. Repas : PV ou mana tout de suite, soins sur
// quelques secondes, ou bonus (dégâts, protection, vitesse) pendant une à deux minutes.
// L'hôte décide de tout (pêche, cuisine, repas) ; un invité envoie ses demandes et reçoit son état.
(() => {
  'use strict';
  // ---------------------------------------------------------------- Données
  const MAX_LEVEL = 40;
  // Niveau requis pour chaque qualité (Commun, Peu commun, Rare, Épique, Légendaire, Mythique).
  const QUALITY_LEVEL = [1, 6, 12, 20, 28, 35];
  const QUALITY_MULT = [1, 1.3, 1.75, 2.3, 3.2, 4.5];
  const BUFF_PCT = [5, 7, 9, 12, 15, 19];
  // Anciennes qualités (huit, avec Héroïque et Céleste) converties une seule fois vers les six actuelles.
  const OLD_QUALITY = [0, 1, 2, 3, 3, 4, 5, 5];
  const qualityName = q => GEAR_RARITIES[q]?.name || 'Commun';
  const qualityColor = q => GEAR_RARITIES[q]?.color || '#aeb4c0';
  // Poissons : nom, icône, recette, couleurs du dessin de la collection, où le trouver et petite bio.
  const FISH = {
    // Poisson doré : seulement par la quête « Le poisson du vieux pêcheur » (aucun banc).
    dore: {
      name: 'Poisson doré',
      icon: '⟦fish_dore⟧',
      recipe: 'dore',
      colors: ['#f0c030', '#b88410', '#fff0a0'],
      where: 'L’étang d’Éloi (quête « Le poisson du vieux pêcheur »)',
      bio: 'Le poisson que le vieil Éloi a poursuivi pendant quarante ans. Il ne se montre qu’à ceux qui savent lire les remous.'
    },
    gardon: {
      name: 'Gardon',
      icon: '⟦fish_gardon⟧',
      recipe: 'soupe',
      colors: ['#c8ccd0', '#8a9098', '#eef2f4'],
      where: 'Lacs des Plaines et de la Forêt ancienne',
      bio: 'Petit poisson argenté des lacs tranquilles. Il se promène en bande et adore les miettes de pain que les enfants du camp lui lancent.'
    },
    truite: {
      name: 'Truite',
      icon: '⟦fish_truite⟧',
      recipe: 'grillade',
      colors: ['#8a9a6a', '#5a6a42', '#d8c8a0'],
      where: 'Lacs des forêts et lacs scintillants',
      bio: 'Rapide et tachetée, elle file dans les eaux fraîches. Les anciens disent qu’une truite qui saute annonce la pluie.'
    },
    carpe: {
      name: 'Carpe',
      icon: '⟦fish_carpe⟧',
      recipe: 'mijote',
      colors: ['#c8a040', '#8a6a20', '#f0d080'],
      where: 'Lacs des Plaines, du Marais et de la Forêt automnale',
      bio: 'Placide et gourmande, elle peut vivre plus vieille que le plus vieux des gardes. On raconte qu’une carpe dorée exauce un vœu… mais personne ne l’a jamais vue.'
    },
    silure: {
      name: 'Silure des oasis',
      icon: '⟦fish_silure⟧',
      recipe: 'epices',
      colors: ['#6a5a4a', '#3e3228', '#a8987a'],
      where: 'Oasis du Désert oublié',
      bio: 'Moustachu et un brin grognon, il dort au fond des oasis pendant la chaleur du jour. Les caravaniers le saluent avec respect.'
    },
    saumon: {
      name: 'Saumon',
      icon: '⟦fish_saumon⟧',
      recipe: 'fume',
      colors: ['#e8908a', '#a85a5a', '#f8d0c8'],
      where: 'En mer, tout autour de l’île',
      bio: 'Voyageur infatigable, il traverse la mer entière pour revenir là où il est né. Sa chair rose fait la fierté des fumoirs.'
    },
    thon: {
      name: 'Thon',
      icon: '⟦fish_thon⟧',
      recipe: 'ragout',
      colors: ['#3a5a8a', '#22385a', '#c8d8e8'],
      where: 'En mer, tout autour de l’île',
      bio: 'Puissant nageur de la haute mer, il file plus vite qu’un cheval au galop. Il faut des bras solides pour le remonter !'
    },
    espadon: {
      name: 'Espadon',
      icon: '⟦fish_espadon⟧',
      recipe: 'brochette',
      colors: ['#4a6a9a', '#2a4268', '#d8e4f0'],
      where: 'En mer (rare)',
      bio: 'Le seigneur des vagues, armé d’une épée naturelle. Les pêcheurs le surnomment « le chevalier des mers ».'
    },
    perche: {
      name: 'Perche',
      icon: '⟦fish_perche⟧',
      recipe: 'meuniere',
      colors: ['#9ab05a', '#5a6a2a', '#e8d890'],
      where: 'Lacs des Plaines verdoyantes',
      bio: 'Rayée de vert et de noir, la nageoire hérissée : elle chasse en bande au bord des roseaux.'
    },
    brochet: {
      name: 'Brochet',
      icon: '⟦fish_brochet⟧',
      recipe: 'quenelles',
      colors: ['#6a8a5a', '#3a5a32', '#d0d8a0'],
      where: 'Lacs de la Forêt ancienne et de la Forêt automnale',
      bio: 'Le loup des lacs : il guette, immobile, puis jaillit comme une flèche. Gare à ses dents !'
    },
    anguille: {
      name: 'Anguille',
      icon: '⟦fish_anguille⟧',
      recipe: 'fumee',
      colors: ['#5a5a3a', '#32321e', '#a8a070'],
      where: 'Lacs du Marais brumeux',
      bio: 'Glissante comme la brume, elle se faufile dans la vase. On dit qu’elle traverse les prés les nuits de pluie.'
    },
    merou: {
      name: 'Mérou',
      icon: '⟦fish_merou⟧',
      recipe: 'merou',
      colors: ['#a86a4a', '#6a3e28', '#e8c0a0'],
      where: 'En mer, tout autour de l’île',
      bio: 'Gros, placide et curieux, il vient regarder les pêcheurs de ses yeux ronds avant de mordre.'
    },
    raie: {
      name: 'Raie',
      icon: '⟦fish_raie⟧',
      recipe: 'raie',
      colors: ['#7a8aa0', '#4a5a70', '#d8e0ea'],
      where: 'En mer (rare)',
      bio: 'Elle vole sous les vagues comme un grand oiseau plat. Les marins disent qu’elle porte chance.'
    },
    lune: {
      name: 'Poisson-lune astral',
      icon: '⟦fish_lune⟧',
      recipe: 'astral',
      colors: ['#c8b0ff', '#8a6ad8', '#fff0ff'],
      where: 'Lacs scintillants de la Forêt enchantée',
      bio: 'Il brille doucement sous la surface. Certains pensent qu’il est tombé du ciel le jour où l’Aube s’est brisée.'
    },
    // Poissons des lacs souterrains (les Tréfonds).
    aveugle: {
      name: 'Poisson aveugle',
      icon: '⟦fish_aveugle⟧',
      recipe: 'papillote',
      colors: ['#e8d8d0', '#b0a098', '#fff8f4'],
      where: 'Lacs noirs des Galeries d’Argile et de la Nécropole (Tréfonds)',
      bio: 'Pâle comme la craie et sans yeux, il se repère aux remous. Les nains disent qu’il entend battre le cœur des pêcheurs.'
    },
    lanterne: {
      name: 'Poisson-lanterne',
      icon: '⟦fish_lanterne⟧',
      recipe: 'lanterne',
      colors: ['#3a4a6a', '#1e2a40', '#ffe070'],
      where: 'Lacs de Khaz-Ombral et de Fangeval (Tréfonds)',
      bio: 'Une petite lumière pend au bout de sa nageoire. Dans le noir des Tréfonds, c’est lui qui trouve les pêcheurs.'
    },
    murene: {
      name: 'Murène des grottes',
      icon: '⟦fish_murene⟧',
      recipe: 'murene',
      colors: ['#5a6a3a', '#34401e', '#c8d080'],
      where: 'Lacs souterrains (Tréfonds)',
      bio: 'Elle se cache entre les roches immergées et mord tout ce qui passe. Même les nains la pêchent avec des gants.'
    },
    fangeux: {
      name: 'Silure fangeux',
      icon: '⟦fish_fangeux⟧',
      recipe: 'fangeux',
      colors: ['#5a5034', '#3a3420', '#a89a6a'],
      where: 'Lacs troubles de Fangeval (Tréfonds)',
      bio: 'Il vit dans la boue tiède et mange les spores qui tombent des champignons. Son goût est… surprenant.'
    }
  };
  // Gibier : animaux du monde qu'on peut chasser (zones : biomes où ils vivent), viande obtenue et petite bio.
  const GAME = {
    lapin: {
      name: 'Lièvre',
      meat: 'lievre',
      zones: [0, 1, 5],
      where: 'Plaines et Forêt ancienne',
      bio: 'Vif et méfiant, il détale au moindre bruit. Approche-toi doucement… ou vise de loin avec un arc !'
    },
    cerf: {
      name: 'Cerf',
      meat: 'venaison',
      zones: [0, 1, 3, 5],
      where: 'Plaines et forêts',
      bio: 'Majestueux roi des forêts, il sent le chasseur de loin. Ses bois tombent chaque hiver et repoussent au printemps.'
    },
    mouton: {
      name: 'Mouton sauvage',
      meat: 'gigot',
      zones: [0],
      where: 'Troupeaux des Plaines',
      bio: 'Il broute paisiblement en troupeau et ne se méfie de rien. Un peu trop, peut-être.'
    },
    grenouille: {
      name: 'Grenouille',
      meat: 'cuisses',
      zones: [2],
      where: 'Bord de l’eau du Marais',
      bio: 'Elle chante tout le soir dans le marais. Ses cuisses sautées sont un mets de choix au Camp de l’Aurore.'
    },
    faisan: {
      name: 'Faisan',
      meat: 'faisan',
      zones: [1, 3],
      where: 'Forêt ancienne et Forêt automnale',
      bio: 'Superbe et bruyant, il s’envole dans un grand fracas d’ailes quand on le surprend dans les fougères.'
    },
    canard: {
      name: 'Canard colvert',
      meat: 'canard',
      zones: [2],
      where: 'Bord de l’eau du Marais',
      bio: 'Il barbote toute la journée entre les roseaux et cancane au moindre bruit.'
    },
    chevre: {
      name: 'Chèvre des sables',
      meat: 'chevre',
      zones: [4],
      where: 'Désert oublié',
      bio: 'Elle grimpe sur les dunes et les rochers brûlants, et broute ce que personne d’autre ne veut.'
    },
    lezard: {
      name: 'Lézard des dunes',
      meat: 'lezard',
      zones: [4],
      where: 'Désert oublié',
      bio: 'Il file entre les pierres chaudes plus vite qu’on ne cligne des yeux. Grillé, il paraît que c’est délicieux.'
    },
    astral: {
      name: 'Bête astrale',
      meat: 'astrale',
      zones: [5],
      where: 'Forêt enchantée (cerfs et lièvres lumineux)',
      bio: 'Cerfs et lièvres baignés de lumière d’étoiles. On dit que leur chair garde un peu de la magie du ciel.'
    },
    crabe: {
      name: 'Crabe des sables',
      meat: 'crabe',
      zones: [0, 1, 2, 3, 4, 5],
      where: 'Plages de toute l’île',
      bio: 'Il fait le tour de l’île en marchant de côté, toujours au bord des vagues, et file à la moindre ombre. Sa chair est douce et sucrée.'
    },
    // Gibier des Tréfonds (zones 6 à 9 : Galeries, Cité Engloutie, Nécropole, Fangeval).
    taupe: {
      name: 'Taupe des cavernes',
      meat: 'taupe',
      zones: [6, 7, 9],
      where: 'Galeries d’Argile et Fangeval (Tréfonds)',
      bio: 'Grosse comme un chien, aveugle et têtue, elle creuse sans cesse. Les nains en font un ragoût réputé.'
    },
    salamandre: {
      name: 'Salamandre des ruines',
      meat: 'salamandre',
      zones: [7, 8],
      where: 'Cité Engloutie et Nécropole (Tréfonds)',
      bio: 'Elle file entre les pierres froides, sa peau brille d’un orange de braise. On dit qu’elle ne craint pas le feu.'
    },
    crapaud: {
      name: 'Crapaud des fanges',
      meat: 'cuisses',
      zones: [9],
      where: 'Boue de Fangeval (Tréfonds)',
      bio: 'Gros, verruqueux et bruyant, il coasse toute la nuit éternelle des Tréfonds. Ses cuisses valent celles des grenouilles.'
    }
  };
  const MEAT = {
    lievre: { name: 'Viande de lièvre', icon: '⟦meat_lievre⟧' },
    venaison: { name: 'Venaison', icon: '⟦meat_venaison⟧' },
    gigot: { name: 'Gigot', icon: '⟦meat_gigot⟧' },
    cuisses: { name: 'Cuisses de grenouille', icon: '⟦meat_cuisses⟧' },
    astrale: { name: 'Chair astrale', icon: '⟦meat_astrale⟧' },
    faisan: { name: 'Viande de faisan', icon: '⟦meat_faisan⟧' },
    canard: { name: 'Magret de canard', icon: '⟦meat_canard⟧' },
    chevre: { name: 'Viande de chèvre', icon: '⟦meat_chevre⟧' },
    lezard: { name: 'Queue de lézard', icon: '⟦meat_lezard⟧' },
    taupe: { name: 'Viande de taupe', icon: '⟦meat_taupe⟧' },
    salamandre: { name: 'Queue de salamandre', icon: '⟦meat_salamandre⟧' },
    crabe: { name: 'Chair de crabe', icon: '⟦meat_crabe⟧' }
  };
  // Ingrédients de cuisine : poissons (bourriche) et viandes (gibecière).
  const ING = {};
  for (const [id, f] of Object.entries(FISH)) ING[id] = { name: f.name, icon: f.icon, bag: 'fish' };
  for (const [id, m] of Object.entries(MEAT)) ING[id] = { name: m.name, icon: m.icon, bag: 'meat' };
  // Herbes de la cueillette (canaan-gathering) : cuisinées en infusions.
  for (const [id, h] of Object.entries(CANAAN_GATHER.HERBS)) ING[id] = { name: h.name, icon: h.icon, bag: 'herb' };
  // Recettes : effet du repas. kind : heal / mana (tout de suite), hot / regen (sur la durée), buff (bonus).
  const RECIPES = {
    soupe: { name: 'Soupe de gardon', fish: 'gardon', kind: 'heal' },
    grillade: { name: 'Truite grillée', fish: 'truite', kind: 'mana' },
    mijote: { name: 'Carpe mijotée', fish: 'carpe', kind: 'hot', seconds: 5 },
    epices: { name: 'Silure aux épices', fish: 'silure', kind: 'buff', stat: 'speed', seconds: 120 },
    fume: { name: 'Saumon fumé', fish: 'saumon', kind: 'buff', stat: 'damage', seconds: 60 },
    ragout: { name: 'Ragoût de thon', fish: 'thon', kind: 'buff', stat: 'armor', seconds: 60 },
    brochette: { name: 'Brochette d’espadon', fish: 'espadon', kind: 'buff', stat: 'feast', seconds: 120 },
    astral: { name: 'Festin astral', fish: 'lune', kind: 'regen', seconds: 10 },
    civet: { name: 'Civet de lièvre', fish: 'lievre', kind: 'both' },
    roti: { name: 'Rôti de venaison', fish: 'venaison', kind: 'buff', stat: 'warrior', seconds: 120 },
    gigot: { name: 'Gigot aux herbes', fish: 'gigot', kind: 'hot', seconds: 8 },
    cuisses: { name: 'Cuisses de grenouille sautées', fish: 'cuisses', kind: 'buff', stat: 'speed', seconds: 180 },
    banquet: { name: 'Banquet céleste', fish: 'astrale', kind: 'regen', seconds: 15 },
    meuniere: { name: 'Perche meunière', fish: 'perche', kind: 'heal' },
    quenelles: { name: 'Quenelles de brochet', fish: 'brochet', kind: 'buff', stat: 'damage', seconds: 90 },
    fumee: { name: 'Anguille fumée', fish: 'anguille', kind: 'hot', seconds: 6 },
    merou: { name: 'Mérou grillé', fish: 'merou', kind: 'buff', stat: 'armor', seconds: 90 },
    raie: { name: 'Raie aux câpres', fish: 'raie', kind: 'both' },
    faisan: { name: 'Faisan rôti', fish: 'faisan', kind: 'buff', stat: 'speed', seconds: 120 },
    magret: { name: 'Magret de canard', fish: 'canard', kind: 'both' },
    chevre: { name: 'Ragoût de chèvre', fish: 'chevre', kind: 'hot', seconds: 8 },
    lezard: { name: 'Brochette de lézard', fish: 'lezard', kind: 'buff', stat: 'damage', seconds: 60 },
    crabe: { name: 'Crabe farci', fish: 'crabe', kind: 'buff', stat: 'armor', seconds: 120 },
    // Infusions des herbes de la cueillette.
    infmenthe: { name: 'Infusion de menthe', fish: 'menthe', kind: 'mana' },
    tisane: { name: 'Tisane de sauge', fish: 'sauge', kind: 'heal' },
    bouillon: { name: 'Bouillon des brumes', fish: 'mousse', kind: 'hot', seconds: 6 },
    soupeortie: { name: 'Soupe d’ortie', fish: 'ortie', kind: 'buff', stat: 'armor', seconds: 120 },
    aloes: { name: 'Jus d’aloès', fish: 'aloes', kind: 'regen', seconds: 8 },
    nectar: { name: 'Nectar de lys étoilé', fish: 'lys', kind: 'regen', seconds: 12 },
    // Recette de la grand-mère d'Éloi : apprise en terminant sa quête.
    dore: { name: 'Poisson doré en croûte de sel', fish: 'dore', kind: 'buff', stat: 'feast', seconds: 240, quest: 5 },
    // Recette d'Amira : apprise en rendant son eau à l'oasis.
    tajine: { name: 'Tajine de l’oasis', fish: 'silure', kind: 'both', quest: 25 },
    // Recettes des Tréfonds (taverne de Dorn, Forteresse de Durgrim, ou n'importe quelle cuisinière).
    papillote: { name: 'Papillote de poisson aveugle', fish: 'aveugle', kind: 'heal' },
    lanterne: { name: 'Poisson-lanterne flambé', fish: 'lanterne', kind: 'buff', stat: 'damage', seconds: 90 },
    murene: { name: 'Murène en ragoût', fish: 'murene', kind: 'both' },
    fangeux: { name: 'Silure fangeux fumé', fish: 'fangeux', kind: 'hot', seconds: 7 },
    taupe: { name: 'Ragoût de taupe des nains', fish: 'taupe', kind: 'buff', stat: 'armor', seconds: 120 },
    salamandre: { name: 'Salamandre grillée', fish: 'salamandre', kind: 'buff', stat: 'speed', seconds: 120 },
    racine: { name: 'Décoction de racine de pierre', fish: 'racine', kind: 'both' },
    lichen: { name: 'Thé de lichen', fish: 'lichen', kind: 'mana' },
    pavot: { name: 'Infusion de pavot funèbre', fish: 'pavot', kind: 'hot', seconds: 8 },
    champignon: { name: 'Velouté de champignons luisants', fish: 'champignon', kind: 'buff', stat: 'feast', seconds: 120 }
  };
  const knows = (hero, id) => !RECIPES[id].quest || CANAAN_QUESTS.done(hero, RECIPES[id].quest);
  const QUICK_COOLDOWN = 20 * 60;
  const xpNeeded = level => Math.round(30 + 12 * Math.pow(level, 1.35));
  const capOf = level => QUALITY_LEVEL.reduce((best, need, q) => (level >= need ? q : best), 0);
  // Effet d'un repas pour un héros, avec les nombres réels (texte de la fenêtre et application).
  function effect(recipe, q, hero) {
    const r = RECIPES[recipe],
      p = hero?.player || { mhp: 100, mmp: 300 },
      m = QUALITY_MULT[q] || 1,
      pct = BUFF_PCT[q] || 5;
    if (r.kind === 'heal') {
      const n = Math.round((100 + 0.03 * p.mhp) * m);
      return { amount: n, text: 'Rend ' + n + ' PV tout de suite' };
    }
    if (r.kind === 'mana') {
      const n = Math.round((100 + 0.05 * p.mmp) * m);
      return { amount: n, text: 'Rend ' + n + ' mana tout de suite' };
    }
    if (r.kind === 'both') {
      const hp = Math.round((60 + 0.02 * p.mhp) * m),
        mp = Math.round((60 + 0.03 * p.mmp) * m);
      return { amount: hp, mana: mp, text: 'Rend ' + hp + ' PV et ' + mp + ' mana tout de suite' };
    }
    if (r.kind === 'hot') {
      const n = Math.round((20 + 0.006 * p.mhp) * m);
      return { amount: n, text: 'Rend ' + n + ' PV par seconde pendant ' + r.seconds + ' s' };
    }
    if (r.kind === 'regen') {
      const share = 1 + 0.25 * q;
      return { share, text: 'Rend ' + share + ' % des PV et du mana par seconde pendant ' + r.seconds + ' s' };
    }
    const label = { speed: 'vitesse', damage: 'dégâts', armor: 'dégâts subis' }[r.stat];
    if (r.stat === 'warrior') {
      const dmg = Math.round(pct * 0.6),
        arm = Math.round(pct * 0.6);
      return { damage: dmg, armor: arm, text: '+' + dmg + ' % de dégâts et −' + arm + ' % de dégâts subis pendant ' + r.seconds / 60 + ' min' };
    }
    if (r.stat === 'feast') {
      const dmg = Math.round(pct * 0.7),
        spd = Math.round(pct * 0.6);
      return { damage: dmg, speed: spd, text: '+' + dmg + ' % de dégâts et +' + spd + ' % de vitesse pendant ' + r.seconds / 60 + ' min' };
    }
    return { [r.stat]: pct, text: (r.stat === 'armor' ? '−' : '+') + pct + ' % de ' + label + ' pendant ' + r.seconds / 60 + ' min' };
  }

  // ---------------------------------------------------------------- Bancs de poissons (mêmes positions chez chacun)
  // Eau profonde (mer et lacs : 0 ; lacs scintillants : 18), au bord d'une rive praticable.
  const DEEP = new Set([0, 18]);
  // Espèces selon l'eau : mer, lac scintillant, ou lac d'un biome (ordre des ZONES).
  const TABLES = {
    sea: [['saumon', 35], ['thon', 30], ['merou', 20], ['espadon', 8], ['raie', 7]],
    glow: [['lune', 60], ['truite', 40]],
    lake: [
      [['gardon', 45], ['carpe', 30], ['perche', 25]],
      [['truite', 45], ['gardon', 30], ['brochet', 25]],
      [['carpe', 40], ['anguille', 35], ['gardon', 25]],
      [['carpe', 40], ['truite', 40], ['brochet', 20]],
      [['silure', 80], ['carpe', 20]],
      [['truite', 50], ['gardon', 30], ['lune', 20]]
    ]
  };
  let spots = null;
  const tile = (tx, ty) => game.world.overworld?.[ty]?.[tx];
  function findSpots() {
    spots = [];
    // Océan : l'eau profonde reliée au bord de la carte ; le reste de l'eau profonde forme les lacs.
    const ocean = new Uint8Array(MAPW * MAPH),
      queue = [];
    for (let x = 0; x < MAPW; x++)
      for (const y of [0, MAPH - 1])
        if (tile(x, y) === 0) {
          ocean[y * MAPW + x] = 1;
          queue.push(y * MAPW + x);
        }
    for (let y = 0; y < MAPH; y++)
      for (const x of [0, MAPW - 1])
        if (tile(x, y) === 0 && !ocean[y * MAPW + x]) {
          ocean[y * MAPW + x] = 1;
          queue.push(y * MAPW + x);
        }
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k],
        x = i % MAPW,
        y = (i - x) / MAPW;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy,
          j = ny * MAPW + nx;
        if (nx >= 0 && ny >= 0 && nx < MAPW && ny < MAPH && !ocean[j] && tile(nx, ny) === 0) {
          ocean[j] = 1;
          queue.push(j);
        }
      }
    }
    const hash = (x, y) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + 9.3) * 43758.5453;
      return n - Math.floor(n);
    };
    for (let ty = 4; ty < MAPH - 4; ty += 2)
      for (let tx = 4; tx < MAPW - 4; tx += 2) {
        const t = tile(tx, ty);
        if (!DEEP.has(t)) continue;
        // Les lacs, plus petits que la mer, ont des bancs plus serrés.
        const sea = t === 0 && ocean[ty * MAPW + tx];
        if (hash(tx, ty) > (sea ? 0.32 : 0.8)) continue;
        // Rive praticable juste à côté (le héros pêche depuis le bord).
        const shore = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(
          ([dx, dy]) => !SOLID.includes(tile(tx + dx, ty + dy)) && tile(tx + dx, ty + dy) !== undefined && !DEEP.has(tile(tx + dx, ty + dy))
        );
        if (!shore || spots.some(s => Math.hypot(s.tx - tx, s.ty - ty) < (sea ? 9 : 5))) continue;
        const zone = Math.max(0, ZONES.indexOf(regionAt(tx, ty))),
          kind = t === 18 ? 'glow' : sea ? 'sea' : 'lake';
        spots.push({ tx, ty, x: (tx + 0.5) * TS, y: (ty + 0.5) * TS, kind, zone, table: kind === 'lake' ? TABLES.lake[zone] : TABLES[kind] });
      }
    // Puis les bancs des lacs souterrains (layer: 'under').
    spots.push(...CANAAN_UNDER.spots());
    return spots;
  }
  const allSpots = () => spots || findSpots();
  const REACH = TS * 2.6;
  function spotNear(x, y) {
    if (game.world.instance) return -1;
    let best = -1,
      bd = REACH;
    allSpots().forEach((s, i) => {
      if (!canaanHere(s)) return;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }
  // Où cuisiner : près d'une cuisinière, d'une marmite ou d'une cheminée, dans un bâtiment (La Marmite dorée au camp,
  // les refuges, ou sa propre maison si on y a posé une cuisinière).
  function nearFire(x, y) {
    return CANAAN_HOUSE.nearStove(x, y);
  }

  // ---------------------------------------------------------------- Hôte : règles
  const profOf = hero => (hero.prof ||= canaanFreshProf());
  const tell = (hero, text) => canaanLootNotice(hero, text);
  function gainXp(hero, skill, amount) {
    const s = profOf(hero)[skill];
    if (s.level >= MAX_LEVEL) return;
    s.exp += amount;
    while (s.level < MAX_LEVEL && s.exp >= xpNeeded(s.level)) {
      s.exp -= xpNeeded(s.level);
      s.level++;
      const unlocked = QUALITY_LEVEL.indexOf(s.level);
      tell(hero, ({ fishing: '⟦prof_fishing⟧ Pêche', cooking: '⟦prof_cooking⟧ Cuisine', hunting: '⟦prof_hunting⟧ Chasse', mining: '⟦prof_mining⟧ Minage', herbalism: '⟦prof_herbalism⟧ Cueillette', enchanting: '⟦prof_enchanting⟧ Enchanteur' }[skill]) + ' niveau ' + s.level + ' !' + (unlocked > 0 ? ' Qualité ' + qualityName(unlocked) + ' débloquée.' : ''));
    }
    if (s.level >= MAX_LEVEL) s.exp = 0;
  }
  // Pêche : lancer, attendre la touche, ferrer.
  function fishStart(hero) {
    const p = hero.player,
      index = spotNear(p.x, p.y);
    if (index < 0) {
      tell(hero, '🎣 Aucun banc de poissons à portée : approche-toi des remous dans l’eau profonde.');
      return false;
    }
    hero.fishing = { spot: index, x: p.x, y: p.y, state: 'wait', at: time, bite: time + 110 + Math.floor(Math.random() * 230), until: 0 };
    return true;
  }
  function fishCatch(hero) {
    const f = hero.fishing,
      s = allSpots()[f.spot],
      total = s.table.reduce((n, [, w]) => n + w, 0);
    let roll = Math.random() * total,
      kind = s.table[0][0];
    for (const [k, w] of s.table) {
      roll -= w;
      if (roll < 0) {
        kind = k;
        break;
      }
    }
    const prof = profOf(hero),
      cap = capOf(prof.fishing.level),
      q = Math.max(0, cap - Math.floor(-Math.log(1 - Math.random()) * 1.3));
    // Le poisson est un objet du sac : sans place pour lui, il est relâché.
    if (!CANAAN_BAG.room(hero, 'fish', kind, q)) {
      hero.fishing = null;
      tell(hero, '🎒 Sac plein : ' + FISH[kind].name + ' relâché.');
      return true;
    }
    const key = kind + ':' + q;
    prof.fish[key] = (prof.fish[key] || 0) + 1;
    discover(prof, kind, q);
    hero.fishing = null;
    float(hero.player.x, hero.player.y - 50, FISH[kind].icon + ' ' + FISH[kind].name + ' (' + qualityName(q) + ')', qualityColor(q));
    tell(hero, '🎣 ' + FISH[kind].name + ' ' + qualityName(q) + ' pêché !');
    gainXp(hero, 'fishing', 10 + 6 * q);
    canaanAchieve(hero, 'fish', kind, q);
    hero.netBag = null;
    return true;
  }
  // Récompense de quête : expérience de pêche et poissons dorés (qualité Épique) dans la bourriche.
  function questReward(hero, { fishXp = 0, goldenFish = 0 }) {
    const prof = profOf(hero);
    if (goldenFish > 0) {
      prof.fish['dore:3'] = (prof.fish['dore:3'] || 0) + goldenFish;
      for (let k = 0; k < goldenFish; k++) discover(prof, 'dore', 3);
    }
    if (fishXp > 0) gainXp(hero, 'fishing', fishXp);
    hero.netBag = null;
  }
  // Collection : nombre de prises et meilleure qualité de chaque espèce (poissons et gibier).
  function discover(prof, kind, q) {
    const first = !prof.codex[kind],
      entry = (prof.codex[kind] ||= { n: 0, best: 0 });
    entry.n++;
    entry.best = Math.max(entry.best, q);
    return first;
  }
  // Chasse : un animal abattu donne sa viande (qualité selon le niveau de chasse). L'hôte vérifie l'espèce,
  // le biome du chasseur et un court délai entre deux prises.
  function hunt(hero, kind) {
    const g = GAME[kind],
      p = hero?.player;
    if (!g || !p || p.dead || hero.away || game.world.instance) return false;
    if ((hero.huntCd || 0) > time) return false;
    // Zone de chasse : 0 à 5 sur l'île, 6 à 9 dans les Tréfonds.
    const zone = canaanUnder() ? CANAAN_UNDER.zoneId(p.x / TS, p.y / TS) : ZONES.indexOf(regionAt(p.x / TS, p.y / TS));
    if (!g.zones.includes(zone)) return false;
    hero.huntCd = time + 40;
    const prof = profOf(hero),
      q = Math.max(0, capOf(prof.hunting.level) - Math.floor(-Math.log(1 - Math.random()) * 1.3)),
      key = g.meat + ':' + q;
    if (!CANAAN_BAG.room(hero, 'meat', g.meat, q)) {
      tell(hero, '🎒 Sac plein : impossible de ramasser la viande.');
      return false;
    }
    const first = discover(prof, kind, q);
    prof.meat[key] = (prof.meat[key] || 0) + 1;
    float(p.x, p.y - 50, MEAT[g.meat].icon + ' ' + MEAT[g.meat].name + ' (' + qualityName(q) + ')', qualityColor(q));
    tell(hero, '🏹 ' + g.name + ' : ' + MEAT[g.meat].name + ' ' + qualityName(q) + (first ? ' · nouvelle espèce dans ton carnet !' : ''));
    gainXp(hero, 'hunting', 10 + 6 * q);
    canaanAchieve(hero, 'hunt', kind, q);
    hero.netBag = null;
    return true;
  }
  function fish(hero) {
    if (!hero || hero.player.dead || hero.away) return false;
    const f = hero.fishing;
    if (!f) return fishStart(hero);
    if (f.state === 'bite') return fishCatch(hero);
    hero.fishing = null;
    tell(hero, '🎣 Tu remontes ta ligne.');
    return true;
  }
  // Cuisiner prend du temps : le héros prépare le repas à la cuisinière (6 s, un peu plus en série), sans bouger.
  function startCook(hero, recipe, quality, count = 1) {
    const r = RECIPES[recipe],
      prof = profOf(hero);
    if (!r || !Number.isInteger(quality) || quality < 0 || quality > 7 || !knows(hero, recipe)) return false;
    if (!nearFire(hero.player.x, hero.player.y)) {
      tell(hero, '🍳 Approche-toi d’une cuisinière pour cuisiner (La Marmite dorée au camp, un refuge ou ta maison).');
      return false;
    }
    const have = prof[ING[r.fish].bag]?.[r.fish + ':' + quality] || 0;
    if (!have) return false;
    const n = Math.max(1, Math.min(count | 0, have, 20));
    return CANAAN_GATHER.startCook(hero, { x: hero.player.x + TS * 0.6, y: hero.player.y - TS * 0.4 }, () => cook(hero, recipe, quality, n), n);
  }
  function cook(hero, recipe, quality, count = 1) {
    const r = RECIPES[recipe],
      prof = profOf(hero);
    if (!r || !Number.isInteger(quality) || quality < 0 || quality > 7 || !knows(hero, recipe)) return false;
    if (!nearFire(hero.player.x, hero.player.y)) {
      tell(hero, '🍳 Approche-toi d’une cuisinière pour cuisiner (La Marmite dorée au camp, un refuge ou ta maison).');
      return false;
    }
    const bag = prof[ING[r.fish].bag],
      key = r.fish + ':' + quality,
      n = Math.max(1, Math.min(count | 0, bag[key] || 0, 20));
    if (!bag[key]) return false;
    let made = 0;
    for (let i = 0; i < n; i++) {
      const mq = Math.min(quality, capOf(prof.cooking.level)),
        meal = recipe + ':' + mq;
      bag[key]--;
      // Le repas prend sa place dans le sac (l'ingrédient vient de libérer la sienne s'il était le dernier).
      if (!CANAAN_BAG.room(hero, 'meal', recipe, mq)) {
        bag[key]++;
        tell(hero, '🎒 Sac plein : impossible de ranger d’autres repas.');
        break;
      }
      prof.meals[meal] = (prof.meals[meal] || 0) + 1;
      gainXp(hero, 'cooking', 14 + 8 * mq);
      canaanAchieve(hero, 'cook', recipe, mq);
      made++;
    }
    if (!bag[key]) delete bag[key];
    if (!made) return false;
    tell(hero, '🍳 ' + made + ' × ' + r.name + ' préparé' + (made > 1 ? 's' : '') + '.');
    hero.netBag = null;
    return true;
  }
  function eat(hero, recipe, quality) {
    const r = RECIPES[recipe],
      prof = profOf(hero),
      key = recipe + ':' + quality;
    if (!r || !prof.meals[key] || hero.player.dead) return false;
    const fx = effect(recipe, quality, hero),
      p = hero.player;
    if (r.kind === 'heal' || r.kind === 'mana' || r.kind === 'both') {
      if ((hero.foodCd || 0) > time) {
        tell(hero, '🍽️ Encore ' + Math.ceil((hero.foodCd - time) / 60) + ' s avant un autre repas rapide.');
        return false;
      }
      hero.foodCd = time + QUICK_COOLDOWN;
      if (r.kind === 'heal' || r.kind === 'both') {
        const before = p.hp;
        p.hp = Math.min(p.mhp, p.hp + fx.amount);
        float(p.x, p.y - 40, '+' + Math.round(p.hp - before), '#73ffa8');
      }
      if (r.kind === 'both') p.mp = Math.min(p.mmp, p.mp + fx.mana);
      else if (r.kind === 'mana') {
        p.mp = Math.min(p.mmp, p.mp + fx.amount);
        float(p.x, p.y - 40, '+' + fx.amount + ' mana', '#7ab8ff');
      }
    } else if (r.kind === 'hot' || r.kind === 'regen') hero.foodHot = { recipe, q: quality, until: time + r.seconds * 60, next: time + 60 };
    else hero.food = { recipe, q: quality, until: time + r.seconds * 60 };
    prof.meals[key]--;
    if (!prof.meals[key]) delete prof.meals[key];
    tell(hero, '🍽️ ' + r.name + ' (' + qualityName(quality) + ') : ' + fx.text + '.');
    hero.netBag = null;
    return true;
  }
  // Action d'un invité (déjà mise en forme) ; l'hôte appelle les mêmes fonctions pour lui-même.
  function handle(hero, action) {
    if (action.op === 'fish') return fish(hero);
    if (action.op === 'cook') return startCook(hero, action.recipe, action.quality, action.count);
    if (action.op === 'eat') return eat(hero, action.recipe, action.quality);
    if (action.op === 'hunt') return hunt(hero, action.game);
    if (action.op === 'gather' || action.op === 'enchant-craft' || action.op === 'enchant-apply') return CANAAN_GATHER.handle(hero, action);
    return false;
  }
  // Étape du pipeline : touches et poissons qui s'échappent, soins des repas, fin des bonus.
  window.CanaanStages.professions = {
    after() {
      if (!started || paused) return;
      CANAAN_GATHER.stepWork();
      for (const hero of game.heroes) {
        const p = hero.player,
          f = hero.fishing;
        if (f) {
          if (p.dead || hero.away || game.world.instance || Math.hypot(p.x - f.x, p.y - f.y) > 24) {
            hero.fishing = null;
            if (!p.dead) tell(hero, '🎣 Tu as bougé : la ligne est remontée.');
          } else if (f.state === 'wait' && time >= f.bite) {
            f.state = 'bite';
            f.until = time + 70;
            if (hero === game.hero) float(p.x, p.y - 58, '❗ Ça mord ! (E)', '#ffd36d');
          } else if (f.state === 'bite' && time > f.until) {
            hero.fishing = null;
            tell(hero, '🎣 Le poisson s’est échappé… Appuie sur E dès que ça mord.');
          }
        }
        const hot = hero.foodHot;
        if (hot) {
          if (time > hot.until || p.dead) hero.foodHot = null;
          else if (time >= hot.next) {
            hot.next += 60;
            const fx = effect(hot.recipe, hot.q, hero);
            if (RECIPES[hot.recipe].kind === 'hot') {
              const before = p.hp;
              p.hp = Math.min(p.mhp, p.hp + fx.amount);
              if (p.hp > before) float(p.x, p.y - 34, '+' + Math.round(p.hp - before), '#73ffa8');
            } else {
              p.hp = Math.min(p.mhp, p.hp + (p.mhp * fx.share) / 100);
              p.mp = Math.min(p.mmp, p.mp + (p.mmp * fx.share) / 100);
            }
          }
        }
        if (hero.food && time > hero.food.until) hero.food = null;
      }
    }
  };
  // Bonus du repas en cours (dégâts, protection, vitesse), lus par le combat et le déplacement.
  const buffOf = hero => (hero?.food && hero.food.until > time ? effect(hero.food.recipe, hero.food.q, hero) : null);
  const damageMult = hero => (100 + (buffOf(hero)?.damage || 0)) / 100;
  const armorMult = hero => (100 - (buffOf(hero)?.armor || 0)) / 100;
  const speedMult = hero => 1 + (buffOf(hero)?.speed || 0) / 100;

  // ---------------------------------------------------------------- État envoyé à un invité
  // Métiers dans le sac (quand ils changent) ; pêche et repas en cours à chaque message privé.
  function bagOf(hero) {
    return profOf(hero);
  }
  function liveOf(hero) {
    const f = hero.fishing,
      left = t => Math.max(0, Math.ceil((t - time) / 60));
    return {
      fishing: f ? { spot: f.spot, bite: f.state === 'bite' } : null,
      food: hero.food && hero.food.until > time ? { recipe: hero.food.recipe, q: hero.food.q, left: left(hero.food.until) } : null,
      hot: hero.foodHot && hero.foodHot.until > time ? { recipe: hero.foodHot.recipe, q: hero.foodHot.q, left: left(hero.foodHot.until) } : null,
      cd: left(hero.foodCd || 0),
      // Travail en cours (miner, cueillir, forger, cuisiner) : animation et barre d'avancement.
      work: CANAAN_GATHER.workView(hero),
      // Gisements de minerai et d'herbes épuisés pour ce héros.
      gather: CANAAN_GATHER.depleted(hero)
    };
  }
  // Invité : ce qu'il a reçu de l'hôte.
  let remoteLive = { fishing: null, food: null, hot: null, cd: 0, gather: [] };
  function applyRemote(live) {
    if (live && typeof live === 'object') remoteLive = live;
  }
  const guest = () => game.mode === 'guest';
  const myLive = () => (guest() ? remoteLive : liveOf(game.hero));
  // Bouton E : lancer, ferrer ou remonter la ligne. Renvoie vrai si E a servi à la pêche.
  function interact() {
    const fishing = guest() ? !!remoteLive.fishing : !!game.hero.fishing;
    // Filon ou herbe à portée (sauf pendant une pêche) : miner ou cueillir.
    if (!fishing && CANAAN_GATHER.interact()) return true;
    if (!fishing && spotNear(P.x, P.y) < 0) return false;
    if (guest()) CANAAN_NET.requestAction({ op: 'fish' });
    else fish(game.hero);
    return true;
  }

  // Un animal abattu par le héros de ce joueur (détecté par life.js) : l'hôte donne la viande.
  const huntKind = (kind, glow) => (glow ? 'astral' : kind);
  const huntable = (kind, glow) => Object.hasOwn(GAME, huntKind(kind, glow));
  function hunted(kind, glow) {
    const id = huntKind(kind, glow);
    if (!GAME[id]) return false;
    if (guest()) return CANAAN_NET.requestAction({ op: 'hunt', game: id });
    return hunt(game.hero, id);
  }

  // ---------------------------------------------------------------- Affichage dans le monde
  function drawSpots(c) {
    if (game.world.instance) return;
    CANAAN_GATHER.draw(c);
    c.save();
    const near = spotNear(P.x, P.y),
      busy = myLive().fishing;
    allSpots().forEach((s, i) => {
      if (!canaanHere(s)) return;
      if (Math.abs(s.x - camX - W / 2) > W / 2 + 80 || Math.abs(s.y - camY - H / 2) > H / 2 + 80) return;
      // Remous : cercles qui s'élargissent, bulles, et un petit poisson qui saute de temps en temps.
      for (let k = 0; k < 3; k++) {
        const age = ((time + k * 30 + i * 17) % 90) / 90;
        c.globalAlpha = (1 - age) * 0.5;
        c.strokeStyle = s.kind === 'glow' ? '#c8f0ff' : '#e8f6ff';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(s.x, s.y, 6 + age * 22, 3 + age * 9, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 0.8;
      c.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) c.fillRect(Math.round(s.x - 8 + ((i * 7 + k * 9) % 16)), Math.round(s.y - 4 - ((time * 0.4 + k * 13) % 10)), 2, 2);
      const jump = (time + i * 97) % 300;
      if (jump < 26) {
        const t = jump / 26;
        c.globalAlpha = 1;
        c.fillStyle = s.kind === 'sea' ? '#8aa8c0' : s.kind === 'glow' ? '#c8b0ff' : '#c0a060';
        c.save();
        c.translate(s.x - 12 + t * 24, s.y - Math.sin(t * Math.PI) * 18);
        c.rotate(-0.8 + t * 1.6);
        c.fillRect(-5, -2, 10, 4);
        c.fillRect(-8, -3, 3, 6);
        c.restore();
      }
      if (i === near && !busy) {
        c.globalAlpha = 1;
        c.font = 'bold 12px system-ui';
        c.textAlign = 'center';
        c.lineWidth = 3;
        c.strokeStyle = '#0c1a24';
        c.fillStyle = '#fff2cb';
        c.strokeText('[E] Pêcher', s.x, s.y - 26);
        c.fillText('[E] Pêcher', s.x, s.y - 26);
      }
    });
    c.restore();
  }
  // Ligne et bouchon de chaque héros qui pêche (le sien, et ceux des autres d'après l'hôte).
  function drawLines(c) {
    if (game.world.instance) return;
    c.save();
    for (const hero of game.heroes) {
      const f = hero === game.hero ? myLive().fishing : guest() ? hero.fishView : hero.fishing && { spot: hero.fishing.spot, bite: hero.fishing.state === 'bite' };
      if (!f) continue;
      const s = allSpots()[f.spot];
      if (!s) continue;
      const p = hero.player,
        hx = p.x + (s.x > p.x ? 16 : -16),
        hy = p.y - 30,
        dip = f.bite ? 5 + Math.sin(time * 0.9) * 3 : Math.sin(time * 0.08) * 2,
        bx = s.x + (p.x - s.x) * 0.25,
        by = s.y + (p.y - s.y) * 0.25 + dip;
      c.globalAlpha = 0.85;
      c.strokeStyle = '#f0f0e8';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(hx, hy);
      c.quadraticCurveTo((hx + bx) / 2, Math.min(hy, by) - 30, bx, by);
      c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = '#e03a2a';
      c.fillRect(Math.round(bx - 3), Math.round(by - 4), 6, 4);
      c.fillStyle = '#ffffff';
      c.fillRect(Math.round(bx - 3), Math.round(by), 6, 3);
      if (f.bite) {
        c.globalAlpha = 0.6;
        c.strokeStyle = '#ffffff';
        c.beginPath();
        c.ellipse(bx, by + 2, 10 + Math.sin(time * 0.5) * 3, 4, 0, 0, Math.PI * 2);
        c.stroke();
        if (hero === game.hero) {
          c.globalAlpha = 1;
          c.font = 'bold 22px system-ui';
          c.textAlign = 'center';
          c.lineWidth = 4;
          c.strokeStyle = '#120c07';
          c.fillStyle = '#ffd36d';
          c.strokeText('❗', p.x, p.y - 62);
          c.fillText('❗', p.x, p.y - 62);
        }
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Fenêtre des métiers (touche P)
  const ui = { tab: 'peche', codex: null };
  const esc = text => safeGearText(text);
  const myProf = () => profOf(game.hero);
  function bar(skill) {
    const s = myProf()[skill],
      need = xpNeeded(s.level),
      pct = s.level >= MAX_LEVEL ? 100 : Math.min(100, (s.exp / need) * 100);
    return (
      '<div class="prof-level"><span><b>Niveau ' + s.level + '</b> / ' + MAX_LEVEL + '</span>' +
      '<div class="prof-bar"><i style="width:' + pct.toFixed(1) + '%"></i></div><span>' + (s.level >= MAX_LEVEL ? 'Maîtrise complète' : s.exp + ' / ' + need + ' XP') + '</span></div>' +
      '<div class="prof-qualities">' +
      QUALITY_LEVEL.map((need, q) => '<span class="prof-q' + (s.level >= need ? ' on' : '') + '" style="color:' + qualityColor(q) + '">' + esc(qualityName(q)) + ' <small>niv. ' + need + '</small></span>').join('') +
      '</div>'
    );
  }
  const stock = (bag, keyOf) =>
    Object.entries(bag)
      .map(([key, n]) => {
        const [id, q] = key.split(':');
        return { id, q: Number(q), n, key };
      })
      .filter(x => keyOf(x.id) && x.n > 0)
      .sort((a, b) => a.id.localeCompare(b.id) || b.q - a.q);
  // Images de la collection : poissons dessinés en pixels, gibier repris des sprites du monde (life.js).
  const icons = new Map();
  function fishIcon(id) {
    if (icons.has(id)) return icons.get(id);
    let url = '';
    try {
      const f = FISH[id],
        [m, d, l] = f.colors,
        cv = document.createElement('canvas');
      cv.width = 66;
      cv.height = 36;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.scale(3, 3);
      const R = (x, y, w, h, col) => {
        g.fillStyle = col;
        g.fillRect(x, y, w, h);
      };
      // Corps, ventre clair, dos sombre, nageoires, queue et œil.
      R(5, 4, 12, 5, m);
      R(4, 5, 14, 3, m);
      R(6, 3, 9, 1, d);
      R(6, 8, 10, 1, l);
      R(7, 7, 8, 1, l);
      R(1, 3, 3, 2, d);
      R(1, 7, 3, 2, d);
      R(2, 5, 3, 2, m);
      R(9, 2, 4, 1, d);
      R(10, 9, 3, 1, d);
      R(15, 5, 1, 1, '#1a1418');
      R(17, 6, 1, 1, d);
      if (id === 'truite') for (const [x, y] of [[7, 5], [10, 4], [12, 6], [9, 6]]) R(x, y, 1, 1, '#3a2a1e');
      if (id === 'silure') {
        R(18, 7, 3, 1, d);
        R(18, 8, 2, 1, d);
      }
      if (id === 'espadon') R(18, 5, 4, 1, l);
      if (id === 'thon') R(4, 6, 1, 1, '#f0d040');
      if (id === 'lune') for (const [x, y] of [[8, 5], [12, 6], [14, 4]]) R(x, y, 1, 1, '#ffffff');
      url = cv.toDataURL();
    } catch {
      url = '';
    }
    icons.set(id, url);
    return url;
  }
  function gameIcon(id) {
    const key = 'g:' + id;
    if (icons.has(key)) return icons.get(key);
    let url = '';
    try {
      url = CANAAN_LIFE.icon(id === 'astral' ? 'cerf' : id, id === 'astral' ? 1 : 0, id === 'astral').toDataURL();
    } catch {
      url = '';
    }
    icons.set(key, url);
    return url;
  }
  // Carnet de collection : une carte par espèce ; découverte (image, nom, prises, meilleure qualité) ou en silhouette.
  function codex(list, iconOf, label) {
    const prof = myProf(),
      found = list.filter(([id]) => prof.codex[id]).length,
      sel = list.find(([id]) => id === ui.codex && prof.codex[id]);
    const img = (id, cls = '') => {
      const url = iconOf(id);
      return url ? '<img class="prof-ico' + cls + '" src="' + url + '" alt="">' : '<span class="prof-ico' + cls + '"></span>';
    };
    let detail = '';
    if (sel) {
      const [id, info] = sel,
        e = prof.codex[id];
      detail =
        '<div class="prof-codex-detail">' + img(id, ' big') + '<div><h4>' + esc(info.name) + '</h4><p>' + esc(info.bio) + '</p>' +
        '<p class="prof-codex-stats">' + label + ' : <b>' + e.n + '</b> · Meilleure qualité : <b style="color:' + qualityColor(e.best) + '">' + esc(qualityName(e.best)) + '</b> · ' + esc(info.where) + '</p></div></div>';
    }
    return (
      '<h3>Collection · ' + found + ' / ' + list.length + ' espèces découvertes</h3>' + detail +
      '<div class="prof-codex">' +
      list
        .map(([id, info]) => {
          const e = prof.codex[id];
          if (!e)
            return '<div class="prof-card unknown" title="' + esc('Où : ' + info.where) + '">' + img(id, ' dark') + '<b>???</b><small>' + esc(info.where) + '</small></div>';
          return (
            '<button type="button" class="prof-card' + (ui.codex === id ? ' on' : '') + '" data-action="profCodex" data-kind="' + id + '">' + img(id) +
            '<b>' + esc(info.name) + '</b><small>× ' + e.n + ' · <span style="color:' + qualityColor(e.best) + '">' + esc(qualityName(e.best)) + '</span></small></button>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function tabFishing() {
    return (
      bar('fishing') +
      '<p class="prof-help">Approche-toi d’un banc de poissons (remous dans l’eau profonde : mer et lacs) et appuie sur <b>E</b>. Quand ça mord ❗, appuie vite sur <b>E</b> pour ferrer. Plus ton niveau est haut, meilleure est la qualité des prises.</p>' +
      codex(Object.entries(FISH), fishIcon, 'Pêchés') +
      '<p class="prof-help">⟦menu_inventory⟧ Tes poissons sont des objets de ton sac (I), par piles de 100.</p>'
    );
  }
  function tabHunting() {
    return (
      bar('hunting') +
      '<p class="prof-help">Chasse le petit gibier avec ton arme (attaque normale) : lièvres, cerfs, moutons sauvages, grenouilles et bêtes astrales. Les animaux craintifs fuient quand tu approches : un arc ou un bâton les atteint de loin. Chaque prise donne de la viande à cuisiner ; plus ton niveau est haut, meilleure est sa qualité.</p>' +
      codex(Object.entries(GAME), gameIcon, 'Chassés') +
      '<p class="prof-help">⟦menu_inventory⟧ Ta viande est un objet de ton sac (I), par piles de 100.</p>'
    );
  }
  function tabCooking() {
    const prof = myProf(),
      fire = nearFire(P.x, P.y),
      cap = capOf(prof.cooking.level);
    return (
      bar('cooking') +
      '<p class="prof-help">' + (fire ? '🔥 Tu es près d’une cuisinière : tu peux cuisiner.' : '🔥 Approche-toi d’une cuisinière pour cuisiner : La Marmite dorée au Camp de l’Aurore, un refuge, ou ta maison si tu en as posé une.') +
      ' Un poisson, une viande ou une herbe donne un repas de sa qualité, plafonnée par ton niveau de cuisine (' + esc(qualityName(cap)) + '). Préparer un repas prend 6 s (un peu plus en série) : reste immobile près de la cuisinière.</p>' +
      '<div class="prof-recipes">' +
      Object.entries(RECIPES)
        .filter(([id]) => knows(game.hero, id))
        .map(([id, r]) => {
          const owned = stock(prof[ING[r.fish].bag], f => f === r.fish);
          return (
            '<article class="prof-recipe"><h4>' + esc(r.name) + '</h4><p>' + ING[r.fish].icon + ' ' + esc(ING[r.fish].name) + ' · ' + esc(effect(id, Math.min(cap, owned[0]?.q ?? 0), game.hero).text) + '</p>' +
            (owned.length
              ? '<div class="prof-actions">' +
                owned
                  .map(x => {
                    const mq = Math.min(x.q, cap);
                    return (
                      '<button type="button" data-action="profCook" data-recipe="' + id + '" data-quality="' + x.q + '"' + (fire ? '' : ' disabled') + ' style="border-color:' + qualityColor(mq) + '">Cuisiner ' + esc(qualityName(mq)) + ' (' + x.n + ')</button>' +
                      (x.n > 1 ? '<button type="button" data-action="profCookAll" data-recipe="' + id + '" data-quality="' + x.q + '"' + (fire ? '' : ' disabled') + '>× ' + Math.min(20, x.n) + '</button>' : '')
                    );
                  })
                  .join('') +
                '</div>'
              : '<p class="prof-empty">Pas de ' + esc(ING[r.fish].name.toLowerCase()) + ' dans ton sac.</p>') +
            '</article>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function tabMeals() {
    const meals = stock(myProf().meals, id => RECIPES[id]),
      live = myLive();
    const active = [];
    if (live.food) active.push('✨ ' + RECIPES[live.food.recipe].name + ' (' + qualityName(live.food.q) + ') : encore ' + live.food.left + ' s');
    if (live.hot) active.push('💚 ' + RECIPES[live.hot.recipe].name + ' : encore ' + live.hot.left + ' s');
    if (live.cd) active.push('⏳ Repas rapide (PV, mana) dans ' + live.cd + ' s');
    return (
      (active.length ? '<div class="prof-active">' + active.map(a => '<p>' + esc(a) + '</p>').join('') + '</div>' : '') +
      '<p class="prof-help">Les repas qui rendent des PV ou du mana tout de suite partagent un délai de 20 s. Un seul bonus (dégâts, protection, vitesse) à la fois : un nouveau remplace l’ancien.</p>' +
      (meals.length
        ? '<div class="prof-grid meals">' +
          meals
            .map(
              x =>
                '<div class="prof-item"><span style="color:' + qualityColor(x.q) + '">' + esc(RECIPES[x.id].name) + '</span><small>' + esc(qualityName(x.q)) + ' · ' + esc(effect(x.id, x.q, game.hero).text) + '</small>' +
                '<b>× ' + x.n + '</b><button type="button" data-action="profEat" data-recipe="' + x.id + '" data-quality="' + x.q + '">Manger</button></div>'
            )
            .join('') +
          '</div>'
        : '<p class="prof-empty">Ton garde-manger est vide : pêche, puis cuisine près d’un feu.</p>')
    );
  }
  let shown = '';
  function render() {
    if (!modalOpen() || !document.querySelector('#window .prof-panel')) return;
    const tabs = [
      ['peche', '⟦prof_fishing⟧ Pêche'],
      ['chasse', '⟦prof_hunting⟧ Chasse'],
      ['minage', '⟦prof_mining⟧ Minage'],
      ['cueillette', '⟦prof_herbalism⟧ Cueillette'],
      ['cuisine', '⟦prof_cooking⟧ Cuisine'],
      ['enchant', '⟦prof_enchanting⟧ Enchantement'],
      ['repas', '🍽️ Repas']
    ];
    const helpers = { bar, esc };
    shown = signature();
    showPanel(
      '<div class="rpg-head"><h2>🎣 Métiers</h2></div><div class="rpg-paper prof-panel">' +
        '<div class="prof-tabs">' + tabs.map(([id, label]) => '<button type="button" class="' + (ui.tab === id ? 'on' : '') + '" data-action="profTab" data-tab="' + id + '">' + label + '</button>').join('') + '</div>' +
        (ui.tab === 'peche'
          ? tabFishing()
          : ui.tab === 'chasse'
            ? tabHunting()
            : ui.tab === 'minage'
              ? CANAAN_GATHER.tabs.mining(helpers)
              : ui.tab === 'cueillette'
                ? CANAAN_GATHER.tabs.herbalism(helpers)
                : ui.tab === 'enchant'
                  ? CANAAN_GATHER.tabs.enchant(helpers)
                  : ui.tab === 'cuisine'
                    ? tabCooking()
                    : tabMeals()) +
        '</div>'
    );
  }
  // Ce qui change l'affichage : métiers, pêche et repas en cours, onglet, sac et équipement (enchantement).
  const signature = () =>
    JSON.stringify([myProf(), myLive(), ui.tab, ui.codex, nearFire(P.x, P.y), game.hero.inventory.map(i => [i.id, i.ench?.value]), Object.values(game.hero.equipment).map(i => i && [i.id, i.ench?.value])]);
  // Ouvrir le panneau sur un onglet (depuis le sac : un enchantement choisi).
  function open(tab) {
    if (!started) return;
    ui.tab = tab;
    showPanel('<div class="rpg-paper prof-panel"></div>');
    render();
  }
  function toggle() {
    if (!started || paused) return;
    if (modalOpen()) {
      const mine = document.querySelector('#window .prof-panel');
      closePanels();
      if (mine) return;
    }
    showPanel('<div class="rpg-paper prof-panel"></div>');
    render();
  }
  setInterval(() => {
    if (!started || !modalOpen() || !document.querySelector('#window .prof-panel')) return;
    if (signature() !== shown) render();
  }, 300);
  // Pastille du repas en cours, sous le panneau du héros.
  setInterval(() => {
    if (!started) return;
    let chip = document.getElementById('foodBuff');
    const hud = document.getElementById('hud');
    if (!chip && hud) {
      chip = document.createElement('div');
      chip.id = 'foodBuff';
      hud.appendChild(chip);
    }
    if (!chip) return;
    const live = myLive(),
      parts = [];
    if (live.food) parts.push('✨ ' + RECIPES[live.food.recipe].name + ' ' + live.food.left + ' s');
    if (live.hot) parts.push('💚 ' + live.hot.left + ' s');
    chip.textContent = parts.join(' · ');
    chip.hidden = !parts.length;
  }, 500);
  const act = action => {
    const done = guest() ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    render();
    return done;
  };
  const actions = {
    tab(id) {
      if (['peche', 'chasse', 'minage', 'cueillette', 'cuisine', 'enchant', 'repas'].includes(id)) ui.tab = id;
      render();
    },
    codex(kind) {
      ui.codex = ui.codex === kind ? null : kind;
      render();
    },
    // Cuisiner : la fenêtre se ferme pour laisser voir le héros aux fourneaux.
    cook(recipe, quality, count = 1) {
      closePanels();
      return act({ op: 'cook', recipe, quality, count });
    },
    eat: (recipe, quality) => act({ op: 'eat', recipe, quality })
  };

  // Sauvegarde : métiers vérifiés (niveaux 1 à 40, poissons et repas connus en quantités entières).
  function sanitize(raw) {
    const out = canaanFreshProf();
    if (!raw || typeof raw !== 'object') return out;
    for (const skill of ['fishing', 'cooking', 'hunting', 'mining', 'herbalism', 'enchanting']) {
      const s = raw[skill] || {};
      out[skill].level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(s.level)) || 1));
      out[skill].exp = Math.max(0, Math.min(xpNeeded(out[skill].level) - 1, Math.floor(Number(s.exp)) || 0));
    }
    // Collection : espèces connues, prises et meilleure qualité.
    if (raw.codex && typeof raw.codex === 'object')
      for (const [id, e] of Object.entries(raw.codex)) {
        const n = Math.floor(Number(e?.n)),
          best = Math.floor(Number(e?.best));
        if ((Object.hasOwn(FISH, id) || Object.hasOwn(GAME, id)) && n > 0) out.codex[id] = { n: Math.min(n, 999999), best: Math.max(0, Math.min(7, best || 0)) };
      }
    // Qualités au format actuel (qv 2) ; une ancienne sauvegarde est convertie (l'enchantement garde son métal).
    const convert = raw.qv !== 2;
    for (const [bag, known] of [['fish', FISH], ['meat', MEAT], ['meals', RECIPES], ['ore', CANAAN_GATHER.ORES], ['herb', CANAAN_GATHER.HERBS], ['ench', CANAAN_GATHER.ENCHANTS]])
      if (raw[bag] && typeof raw[bag] === 'object')
        for (const [key, n] of Object.entries(raw[bag])) {
          const [id, qs] = key.split(':'),
            count = Math.floor(Number(n));
          if (!Object.hasOwn(known, id) || !/^[0-7]$/.test(qs) || !(count > 0)) continue;
          const q = bag === 'ench' ? Math.min(5, Number(qs)) : convert ? OLD_QUALITY[Number(qs)] : Math.min(5, Number(qs)),
            k = id + ':' + q;
          out[bag][k] = Math.min((out[bag][k] || 0) + count, 9999);
        }
    for (const e of Object.values(out.codex)) e.best = convert ? OLD_QUALITY[e.best] : Math.min(5, e.best);
    return out;
  }
  window.CANAAN_PROF = Object.freeze({
    profOf,
    open,
    FISH,
    GAME,
    MEAT,
    RECIPES,
    QUALITY_LEVEL,
    MAX_LEVEL,
    xpNeeded,
    capOf,
    effect,
    spots: allSpots,
    // Bancs de l'île calculés à la surface (avant de descendre dans les Tréfonds).
    prepare: () => allSpots().length,
    spotNear,
    nearFire,
    fish,
    hunt,
    hunted,
    huntable,
    cook,
    eat,
    handle,
    gainXp,
    questReward,
    damageMult,
    armorMult,
    speedMult,
    bagOf,
    liveOf,
    myLive,
    applyRemote,
    interact,
    drawSpots,
    drawLines,
    sanitize,
    actions,
    toggle,
    render
  });
  window.toggleProfessions = toggle;
})();
