// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre VI : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 26,
    chapter: 5,
    main: true,
    title: 'Le sanctuaire des six lumières',
    npc: 'lumi',
    site: 'q26',
    requires: 22,
    level: 52,
    summary:
      'Lumi te mène au Sanctuaire des Six Lumières. Trois épreuves attendent avant qu’on puisse poser les étoiles sur l’autel et ouvrir la Chambre de l’Aurore.',
    steps: [
      {
        k: 'race',
        n: 6,
        spread: [5, 10],
        text: 'Épreuve du souffle : courir avec la lumière avant qu’elle s’éteigne'
      },
      {
        k: 'wave',
        waves: [4, 5, 5],
        mobs: ['Gardien astral', 'Fée sauvage'],
        what: 'la flamme du sanctuaire',
        icon: '🔥',
        art: 'crystal',
        at: [0, 1],
        label: 'Allumer la flamme',
        text: 'Épreuve du courage : garder la flamme du sanctuaire'
      },
      {
        k: 'pick',
        n: 6,
        spread: [4, 9],
        art: 'crystal',
        icon: '✨',
        item: 'Lumière retrouvée',
        label: 'Recueillir la lumière',
        text: 'Épreuve de la lumière : recueillir les six lumières égarées'
      },
      { k: 'spot', at: [0, -1], text: 'Placer les étoiles sur l’autel (E)' }
    ],
    reward: { gold: 520, flags: ['sanct_lumieres'], text: 'Accès à la Chambre de l’Aurore' },
    talk: {
      offer: [
        '✨ C’est ici. Le Sanctuaire des Six Lumières… je m’en souviens. Si tu poses les étoiles sur l’autel, la Chambre de l’Aurore s’ouvrira, et le Cœur sera derrière.',
        '✨ Mais les anciens ont laissé trois épreuves : courir avec la lumière, garder la flamme, et recueillir les lumières égarées. Je reste près de toi.'
      ],
      active:
        '✨ Trois épreuves, puis l’autel. Je brille plus fort quand tu es près de moi. Tu l’avais remarqué ?',
      ready:
        '✨ Les étoiles brillent ensemble ! La Chambre de l’Aurore est ouverte. Auralis, le gardien du Cœur, nous y attend… et Vesper arrive.',
      after: '✨ La Chambre de l’Aurore est ouverte. Auralis nous attend. Vite, avant Vesper !'
    }
  },
  {
    id: 27,
    chapter: 5,
    main: true,
    title: 'Le Cœur de l’Aurore',
    npc: 'auralis',
    site: 'q27',
    requires: 26,
    level: 58,
    summary:
      'Dans la Chambre de l’Aurore, Auralis, le dernier gardien, attend pour réveiller le Cœur. Sa sœur Vesper arrive en même temps que toi, et l’Ombre avec elle.',
    steps: [
      { k: 'spot', at: [-4, 0], text: 'Lire la fresque du gardien (E)' },
      {
        k: 'defense',
        text: 'Protéger les six cristaux (E sur l’autel pour commencer)'
      },
      { k: 'guardian', text: 'Vaincre l’Ombre, le cœur des échos (E sur le sceau)' },
      { k: 'choice', npc: 'vesper', text: 'Décider du sort de Vesper' },
      { k: 'collect', n: 6, text: 'Réunir la lumière des six cristaux' }
    ],
    reward: {
      gold: 900,
      flags: ['star6', 'sanct_aurore', 'title', 'aurora'],
      text: 'Titre « Gardien de l’Aurore », aura lumineuse, sixième étoile et la Chambre de l’Aurore pour toujours'
    },
    talk: {
      offer: [
        'Je suis Auralis, le gardien du Cœur. Je suis resté ici quand tout le monde est parti, même quand ma sœur Vesper a cessé de chanter.',
        'Elle arrive, et l’Ombre avec elle. Lis ma fresque, puis défends les six cristaux pendant que le Cœur s’éveille. Si l’Ombre les brise tous, il se rendormira pour toujours.'
      ],
      active: 'Tiens bon. Tant qu’il reste des cristaux, le Cœur peut se réveiller.',
      ask: 'L’Ombre m’a tenu compagnie quand vous m’avez laissée. Elle n’était pas mauvaise, au début. Elle avait faim, et moi aussi. Je suis fatiguée, gardien. Que fais-tu de moi ?',
      ready:
        'Le Cœur s’éveille… Et Lumi… regarde-la. Elle était une étincelle du Cœur depuis le début. Elle pouvait rentrer. Elle a choisi de rester avec toi. Gardien de l’Aurore.',
      after: 'L’île respire à nouveau. Les six sanctuaires brillent. Merci, Gardien.',
      afterChoice: [
        'Ma sœur a repris sa place dans le chœur. Elle chante faux. C’est le plus beau son que j’aie entendu depuis mille ans.',
        'Ma sœur a repris la mer. Elle écrira, dit-elle. Je lui ai laissé une étoile allumée, au cas où.'
      ]
    },
    choices: ['Reviens chanter avec nous', 'Pars en paix, et ne reviens pas'],
    verse: 'Cœur, réveille-toi : nous chantons à nouveau, l’aube a gardé ta place au bord de l’eau.',
    memory:
      'Le Cœur de l’Aurore se réveille. Les six sanctuaires retrouvent leur lumière, et Lumi révèle la vérité : elle était une étincelle du Cœur, tombée du ciel pour trouver quelqu’un capable de le réveiller. Ce quelqu’un, c’était toi. Quant à Vesper, elle a entendu son nom dans la Ballade. Personne ne l’avait effacé de la musique.'
  },
  {
    id: 28,
    chapter: 5,
    main: false,
    title: 'Le monde à l’envers',
    npc: 'lyss',
    site: 'q28',
    level: 53,
    summary:
      'Lyss, de la Forêt enchantée : deux clairières se reflètent l’une l’autre, et les fées sauvages brouillent encore le reflet. Il faut les calmer, puis actionner les leviers pour ouvrir un passage jusqu’au coffre de l’autre clairière.',
    steps: [
      {
        k: 'kill',
        n: 6,
        mobs: ['Fée sauvage'],
        what: 'Fée calmée',
        text: 'Calmer les fées qui brouillent le reflet'
      },
      {
        k: 'puzzle',
        text: 'Actionner les leviers pour ouvrir un passage dans l’autre clairière'
      }
    ],
    reward: { gold: 500, item: 'Légendaire', text: 'Le coffre enchanté (équipement Légendaire)' },
    talk: {
      offer: [
        'Regarde : deux clairières jumelles. Mais le miroir est capricieux : la gauche devient la droite. Et les fées s’amusent à le rider.',
        'Calme-les, puis abaisse les leviers (E) ici, et les rochers de l’autre clairière bougeront. Ouvre-toi un chemin jusqu’au coffre.'
      ],
      active: 'Deux leviers abaissés, un seul levé. Regarde quels rochers bougent de l’autre côté du miroir.',
      ready:
        'Tu as traversé le miroir ! Le reflet remplit le coffre à chaque pleine lune. Reviens quand les fées recommenceront.',
      after: 'Parfois, je me demande quelle clairière est la vraie. Les fées, elles, s’en moquent.'
    }
  },
  {
    id: 29,
    chapter: 5,
    main: false,
    title: 'Le dragon qui avait peur de voler',
    npc: 'pyria',
    site: 'q29',
    level: 55,
    summary:
      'Pyria, de la Forêt enchantée, élève un jeune dragon, Braise, qui a peur du vide. Les grands drakes viennent se moquer de lui. Il faut lui donner du courage avec des pêches étoilées, chasser les moqueurs et courir devant lui pour lui montrer comment prendre son élan.',
    steps: [
      {
        k: 'pick',
        n: 5,
        spread: [5, 10],
        icon: '🍑',
        item: 'Pêche étoilée',
        label: 'Cueillir la pêche',
        text: 'Cueillir des pêches étoilées pour Braise'
      },
      {
        k: 'wave',
        waves: [2, 3],
        mobs: ['Drake astral'],
        what: 'Braise',
        icon: '🐉',
        art: 'horn',
        at: [-3, 1],
        label: 'Sonner le cor',
        text: 'Protéger Braise des drakes qui se moquent de lui'
      },
      {
        k: 'race',
        n: 6,
        spread: [5, 10],
        text: 'Courir devant Braise pour lui montrer comment prendre son élan',
        world: ['pyria']
      }
    ],
    reward: {
      gold: 540,
      item: 'Épique',
      flags: ['pyria'],
      text: 'Équipement Épique de ton niveau et Pyria s’installe dans la forêt'
    },
    talk: {
      offer: [
        'Braise a peur du vide. Les grands drakes le savent, et ils viennent rire de lui tous les soirs.',
        'Donne-lui des pêches, fais taire les moqueurs, puis cours devant lui. Aussi vite que tu peux. Il te suivra, j’en suis sûre.'
      ],
      active: 'Il aime les pêches bien mûres. Et il aime bien tes bottes, mais ne le laisse pas les manger.',
      ready:
        'IL VOLE ! Braise vole ! Il oublie parfois comment faire, alors on recommencera. Merci, il t’adore.',
      after: 'Braise fait des loopings, quand il n’a pas peur. Les jours de vent, il faut tout recommencer.'
    }
  },
  {
    id: 30,
    chapter: 5,
    main: false,
    title: 'Le lac aux mille étoiles',
    npc: 'elya',
    site: 'q30',
    level: 57,
    summary:
      'Élya, de la Forêt enchantée : les ents corrompus cachent encore le ciel au lac aux mille étoiles. Il faut les apaiser, puis marcher sur les pierres du lac dans l’ordre où s’allument les étoiles du reflet.',
    steps: [
      {
        k: 'kill',
        n: 6,
        mobs: ['Ent corrompu'],
        what: 'Ent apaisé',
        text: 'Apaiser les ents corrompus autour du lac'
      },
      { k: 'puzzle', text: 'Marcher sur les pierres du lac dans l’ordre de la constellation reflétée' }
    ],
    reward: {
      gold: 600,
      jewel: true,
      text: 'Un bijou Légendaire avec des statistiques secondaires aléatoires'
    },
    talk: {
      offer: [
        'Regarde le reflet : une constellation, le Cerf des neiges. Ses étoiles s’allument l’une après l’autre. Enfin, quand les ents ne lui cachent pas le ciel.',
        'Apaise-les, puis marche sur les pierres du lac dans le même ordre. Une erreur, et le reflet s’efface : il faudra recommencer.'
      ],
      active: 'Regarde le reflet : l’étoile qui s’allume en premier, puis la suivante…',
      ready:
        'Le lac t’a reconnu. Chaque nuit claire, il recommence sa constellation. Reviens quand les ents la cacheront de nouveau.',
      after: 'Les nuits claires, le lac brille pour toi. Les ents, eux, n’aiment pas la lumière.'
    }
  }
];
