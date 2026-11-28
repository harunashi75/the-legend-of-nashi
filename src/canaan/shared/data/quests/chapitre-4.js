// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre IV : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 16,
    chapter: 3,
    main: true,
    title: 'Le village des feuilles dorées',
    npc: 'erable',
    site: 'q16',
    requires: 12,
    level: 32,
    summary:
      'La troisième étoile dort sous les feuilles d’un village oublié de la Forêt automnale. La Confrérie du Voile pille ses ruines pour la trouver avant toi.',
    steps: [
      { k: 'collect', n: 4, text: 'Toucher les quatre feuilles dorées pour voir les souvenirs du village' },
      {
        k: 'kill',
        n: 8,
        mobs: ['Pilleur', 'Bandit'],
        what: 'Voilé mis en fuite',
        text: 'Chasser les pilleurs et les bandits de la Confrérie'
      },
      {
        k: 'loot',
        n: 4,
        mobs: ['Pilleur', 'Bandit'],
        icon: '🎒',
        item: 'Objet du village',
        text: 'Reprendre ce qu’ils ont volé au village'
      },
      {
        k: 'pick',
        n: 4,
        at: [
          [-4, -2],
          [4, -2],
          [-4, 2],
          [4, 2]
        ],
        art: 'house',
        keep: true,
        icon: '🏚️',
        item: 'Maison rendue à elle-même',
        label: 'Rendre l’objet à la maison',
        text: 'Rendre à chaque maison ce qui lui appartient',
        world: ['sanct_saisons']
      }
    ],
    reward: {
      gold: 280,
      flags: ['star3', 'sanct_saisons'],
      text: 'Troisième étoile et accès à la Bibliothèque des Saisons'
    },
    talk: {
      offer: [
        'Ici vivait un village, avant l’Ombre. Ses maisons sont tombées, mais les feuilles dorées se souviennent de tout, et la troisième étoile dort sous elles.',
        'Les Voilés fouillent les ruines et emportent les souvenirs des maisons. Touche les feuilles pour voir le village, chasse les pilleurs, reprends ce qu’ils ont volé et rends-le à chaque maison. Quand le village se souviendra de lui-même, l’étoile se lèvera.'
      ],
      active:
        'Les pilleurs de la Confrérie rôdent dans toute la Forêt automnale. Ils cherchent l’étoile sans savoir qu’elle est sous leurs pieds.',
      ready:
        'Le village se souvient… et l’étoile se lève des feuilles ! Trois sur six. Mais une question demeure : pourquoi les anciens ont-ils endormi le Cœur, et comment le réveiller ? Solenne garde la fresque des saisons, près des grands érables. Elle le sait peut-être.',
      after:
        'Trois étoiles sur six. Solenne garde la fresque des saisons : elle sait pourquoi le Cœur s’est endormi.'
    },
    memory:
      'Les feuilles dorées : un village heureux, une forge, un four, une cloche et une harpe. Quand l’ombre vint, les villageois partirent vers les sanctuaires… en laissant tout derrière eux.'
  },
  {
    id: 17,
    chapter: 3,
    main: true,
    title: 'Le secret des quatre saisons',
    npc: 'solenne',
    site: 'q17',
    requires: 16,
    level: 36,
    summary:
      'La fresque des saisons raconte pourquoi les anciens ont endormi le Cœur. Elle est en morceaux, et les esprits des saisons la gardent.',
    steps: [
      { k: 'collect', n: 4, text: 'Retrouver les quatre fragments de la fresque' },
      {
        k: 'wave',
        waves: [3, 3, 4, 4],
        seasons: ['Fée sauvage', 'Élémentaire', 'Corbeau spectral', 'Serpent des glaces'],
        mobs: ['Corbeau spectral'],
        what: 'la fresque',
        icon: '🍂',
        art: 'pillar',
        at: [0, 0],
        label: 'Assembler la fresque',
        text: 'Tenir tête aux quatre saisons, l’une après l’autre',
        world: ['archives']
      },
      { k: 'guardian', text: 'Vaincre Fanegrise, l’écho de l’automne (E sur le sceau)' }
    ],
    reward: {
      gold: 320,
      flags: ['archives'],
      text: 'Accès aux archives anciennes (un souvenir dans le journal)'
    },
    talk: {
      offer: [
        'La fresque des saisons dit pourquoi le Cœur s’est endormi. Elle est en quatre morceaux : rassemble-les et repose-les au centre du cercle.',
        'Les esprits du printemps, de l’été, de l’automne et de l’hiver viendront voir qui ose. Ils ne sont pas méchants : ils ont peur. Tiens bon.'
      ],
      active: 'Les fragments sont au nord, à l’est, au sud et à l’ouest. Comme les saisons.',
      ready:
        'Les archives parlent : « Le Cœur fut endormi pour que l’Ombre ne le dévore pas. » Mais personne n’a écrit comment le réveiller… sauf une main, dans la marge : « Moi, je m’en souviens. » Vesper. Les anciens ont laissé une machine sous le désert, dans la Cité des Étoiles : elle saura. Sahir connaît le chemin.',
      after:
        'Pour savoir comment réveiller le Cœur, il faut la machine de la Cité des Étoiles, sous le Désert oublié. Sahir connaît les obélisques qui en gardent l’entrée.'
    },
    verse: 'Quatre saisons tournent autour d’un seul nom ; la feuille qui tombe est encore une chanson.',
    memory:
      'Les archives des saisons : l’Ombre se nourrissait de lumière. Pour l’affamer, les anciens endormirent le Cœur et cachèrent ses six étoiles. Quand l’Ombre disparut, plus personne ne se souvenait comment le réveiller. Dans la marge, une autre main a écrit : « Moi, je m’en souviens. »'
  },
  {
    id: 18,
    chapter: 3,
    main: false,
    title: 'Le concours des feuilles',
    npc: 'flavio',
    site: 'q18',
    level: 33,
    summary:
      'Flavio, de la Forêt automnale, organise un concours à chaque saison et cherche des concurrents : une course à travers les érables, puis la feuille dorée à attraper au vol.',
    steps: [
      { k: 'race', n: 6, spread: [6, 11], text: 'Courir la boucle du concours avant la fin du temps' },
      { k: 'catch', text: 'Attraper la feuille dorée dans le vent (E quand elle est sur toi)' }
    ],
    reward: { gold: 220, item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Le grand concours d’automne ! Première épreuve : la boucle des érables. Six fanions, et le temps file.',
        'Deuxième épreuve : une feuille dorée danse dans le vent. Ne la poursuis pas, devine où elle va. E quand elle passe sur toi !'
      ],
      active:
        'Touche les six fanions avant la fin du temps. Pour la feuille, ne la poursuis pas : devine où le vent l’emmène, et E quand elle passe sur toi.',
      ready:
        'Champion ! Garde la feuille, elle ne fanera jamais. Reviens au prochain concours : je compte bien te battre.',
      after: 'Le prochain concours approche. Je l’annoncerai au tableau de la guilde.'
    }
  },
  {
    id: 19,
    chapter: 3,
    main: false,
    title: 'Le moulin qui tournait à l’envers',
    npc: 'odel',
    site: 'q19',
    level: 35,
    summary:
      'Odel, meunier de la Forêt automnale : les trolls lui ont encore volé ses engrenages pour s’en faire des colliers. Depuis, son moulin tourne à l’envers, le grain s’entasse au grenier, et une grosse bête y a fait son nid.',
    steps: [
      {
        k: 'loot',
        n: 3,
        chance: 0.5,
        mobs: ['Troll'],
        icon: '⚙️',
        item: 'Engrenage',
        text: 'Reprendre les engrenages aux trolls'
      },
      {
        k: 'pick',
        n: 3,
        at: [
          [-2, 0],
          [0, 0],
          [2, 0]
        ],
        art: 'gear',
        keep: true,
        icon: '⚙️',
        item: 'Engrenage remonté',
        label: 'Remonter l’engrenage',
        text: 'Remonter les engrenages du moulin',
        world: ['grenier']
      },
      {
        k: 'hunt',
        mob: 'Corbeau spectral',
        title: 'Scrr-Scrr, la terreur du grenier',
        at: [4, 2],
        icon: '🪶',
        label: 'Ouvrir le grenier',
        text: 'Déloger ce qui fait « scrr-scrr » dans le grenier'
      }
    ],
    reward: {
      gold: 300,
      flags: ['grenier'],
      item: 'Épique',
      text: 'Or et le coffre du grenier (équipement Épique)'
    },
    talk: {
      offer: [
        'Les trolls m’ont pris trois engrenages. Des colliers ! Ils en font des colliers ! Et mon moulin tourne à l’envers.',
        'Reprends-les, remonte-les. Et tant que tu y es… quelque chose fait « scrr-scrr » dans mon grenier. Je préfère ne pas savoir.'
      ],
      active:
        'Reprends mes engrenages aux trolls, remonte-les dans le moulin, puis chasse la bête qui mange mon grain au grenier.',
      ready:
        'Il tourne dans le bon sens, et le grenier est calme. Les trolls finiront par revenir, ils adorent ce qui brille. Merci !',
      after:
        'Ma farine est fine comme de la poussière d’étoile. Si les trolls reviennent, la guilde le saura.'
    }
  },
  {
    id: 20,
    chapter: 3,
    main: false,
    title: 'Le renard et les trois voyageurs',
    npc: 'voyageurs',
    site: 'q20',
    level: 37,
    summary:
      'Trois voyageurs campent dans la Forêt automnale : un renard magique leur vole leurs provisions, et ils ne sont jamais d’accord sur l’endroit où il se cache. Il faut écouter leurs témoignages, trouver la cachette et rattraper le renard.',
    steps: [
      { k: 'clues', n: 3, text: 'Écouter les trois témoignages' },
      { k: 'search', text: 'Fouiller la bonne cachette (E)' },
      {
        k: 'chase',
        n: 1,
        art: 'fox',
        who: 'Malice',
        label: 'Attraper le renard',
        at: [-4, -2],
        text: 'Rattraper le renard magique'
      }
    ],
    reward: { gold: 260, item: 'Épique', text: 'La cachette secrète du renard (équipement Épique)' },
    talk: {
      offer: [
        'Un renard qui brille ! Il a filé avec nos provisions. Chacun de nous l’a vu, mais pas au même endroit…',
        'Écoute-nous tous les trois, compare, et trouve sa cachette. Attention, l’un de nous se trompe souvent.'
      ],
      active: 'Deux de nos témoignages sont vrais. Le troisième… c’est Gaspard, il voit mal.',
      ready:
        'La cachette ! Et nos provisions… Ce renard est malin : il trouvera une autre cachette, c’est sûr.',
      after: 'Malice, le renard, change de cachette à chaque lune. On laisse toujours un mot à la guilde.'
    },
    witnesses: true
  }
];
