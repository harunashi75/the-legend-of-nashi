// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre I : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 1,
    chapter: 0,
    main: true,
    title: 'La lumière tombée du ciel',
    npc: 'liora',
    site: 'q1',
    level: 2,
    summary:
      'Cette nuit, une lumière est tombée juste à l’est du Camp de l’Aurore. Liora l’a vue, et elle a peur d’aller voir seule.',
    steps: [
      { k: 'trail', text: 'Suivre les traces lumineuses depuis le camp' },
      {
        k: 'pick',
        n: 4,
        spread: [2, 5],
        icon: '✨',
        item: 'Éclat d’étoile',
        label: 'Ramasser l’éclat',
        text: 'Ramasser les éclats tombés autour du cristal'
      },
      {
        k: 'wave',
        waves: [2, 3],
        mobs: ['Slime'],
        what: 'le cristal',
        art: 'crystal',
        at: [0, 1],
        label: 'Rendre ses éclats au cristal',
        text: 'Protéger le cristal des slimes attirés par sa lumière'
      }
    ],
    reward: { gold: 60, flags: ['lumi'], text: 'Lumi devient ta compagne de voyage' },
    talk: {
      offer: [
        'Tu l’as vue, toi aussi ? Une lumière est tombée cette nuit, juste à l’est du camp !',
        'Elle a laissé des traces qui brillent dans l’herbe. Suis-les, s’il te plaît, et dis-moi ce que c’est. Moi, je n’ose pas y aller seule.'
      ],
      active: 'Les traces partent vers l’est du camp. Suis-les jusqu’au bout : la lumière doit être là.',
      ready:
        'Elle te suit ? C’est une petite créature de lumière… Lumi, c’est ça ? Le vieil Orven, aux Ruines de la Couronne, saura ce qu’elle est. Va le voir avec elle.',
      after: 'Va voir Orven aux Ruines de la Couronne. Il connaît toutes les vieilles histoires de lumière.'
    }
  },
  {
    id: 2,
    chapter: 0,
    main: true,
    title: 'La carte aux six étoiles',
    npc: 'orven',
    site: 'q2',
    requires: 1,
    level: 5,
    summary:
      'Orven reconnaît Lumi : une étincelle du Cœur de l’Aurore. Sa vieille carte montre où dorment les six étoiles du Cœur, mais une femme voilée a lâché les loups dessus.',
    steps: [
      {
        k: 'loot',
        n: 5,
        mobs: ['Loup', 'Sanglier'],
        icon: '🗺️',
        item: 'Fragment de carte',
        text: 'Reprendre les fragments de carte aux loups et aux sangliers'
      },
      {
        k: 'pick',
        n: 3,
        at: [
          [-4, -3],
          [4, -2],
          [1, 4]
        ],
        icon: '✦',
        item: 'Sceau d’ombre',
        label: 'Arracher le sceau',
        ambush: ['Loup', 2],
        text: 'Arracher les trois sceaux d’ombre plantés dans les ruines'
      },
      { k: 'guardian', text: 'Vaincre Ronce-Moussue, l’écho des ruines (E sur le sceau)' }
    ],
    reward: { gold: 90, flags: ['starmap'], text: 'Carte des sanctuaires dans le journal' },
    talk: {
      offer: [
        'Par ma barbe… Cette lumière vient du Cœur de l’Aurore ! Le Cœur protégeait l’île, autrefois. Les anciens l’ont endormi et ont caché ses six étoiles dans six sanctuaires. Ma carte les montre.',
        'Hier soir, une femme voilée a sifflé, et les loups ont mis ma carte en pièces. Reprends les morceaux aux loups et aux sangliers, puis arrache les sceaux noirs qu’elle a plantés dans mes ruines.'
      ],
      active:
        'Les morceaux de ma carte sont dans la gueule des loups et des sangliers des plaines. Les sceaux noirs sont ici, dans les ruines.',
      ready:
        'La carte est entière ! Regarde : six étoiles, six sanctuaires. Si on les retrouve toutes et qu’on les ramène au Cœur, il se réveillera, et l’île sera de nouveau protégée. La première dort dans la Forêt ancienne : va voir Sylva, la gardienne des chants. Et méfie-toi de la femme voilée : elle cherche les étoiles, elle aussi.',
      after:
        'La première étoile est dans la Forêt ancienne. Sylva t’y attend. Trouve les étoiles avant la femme voilée.'
    },
    verse: 'Une étincelle tombe où nul ne l’attend, et la plaine se souvient du premier chant.',
    memory:
      'Sur le dernier sceau, un nom gravé à l’envers : Vesper. Orven a pâli en le lisant, et n’a rien voulu en dire.'
  },
  {
    id: 3,
    chapter: 0,
    main: false,
    title: 'Le mouton aux grandes ambitions',
    npc: 'milo',
    site: 'q3',
    level: 4,
    summary:
      'Milo, berger des Plaines verdoyantes : Pompon, son mouton, s’est encore sauvé pour monter au sommet de la colline, et les loups rôdent. Il faut le rattraper, chasser les loups et l’accompagner là-haut, sinon il recommencera cette nuit.',
    steps: [
      {
        k: 'chase',
        n: 1,
        art: 'sheep',
        who: 'Pompon',
        label: 'Attraper Pompon',
        text: 'Rattraper Pompon, qui court dans tous les sens'
      },
      { k: 'kill', n: 6, mobs: ['Loup'], what: 'Loup vaincu', text: 'Éloigner les loups de la colline' },
      {
        k: 'escort',
        art: 'sheep',
        who: 'Pompon',
        from: [-4, 3],
        to: [3, -4],
        ambush: [['Loup', 2]],
        label: 'Emmener Pompon',
        text: 'Accompagner Pompon jusqu’au drapeau du sommet',
        world: ['sommet']
      }
    ],
    reward: { gold: 70, item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Pompon veut monter au sommet de la colline. Il en rêve, je te jure ! Alors il saute la barrière toutes les nuits.',
        'Rattrape-le, chasse les loups, puis monte là-haut avec lui. Juste une fois. Pour qu’il voie.'
      ],
      active:
        'Rattrape Pompon, chasse les loups de la colline, puis monte avec lui jusqu’au drapeau. Têtu comme un mouton, je te dis !',
      ready:
        'Il est en haut ! Regarde-le, il est si fier. Merci de ta patience : la guilde aura ton paiement, et moi ma nuit de sommeil.',
      after:
        'Pompon regarde le coucher de soleil du haut de la colline. Il recommencera, j’en suis sûr : je repasserai par la guilde.'
    }
  },
  {
    id: 4,
    chapter: 0,
    main: false,
    title: 'Le trésor qui n’existe pas',
    npc: 'bastian',
    site: 'q4',
    level: 6,
    summary:
      'Bastian, chasseur de trésors des Plaines verdoyantes : les sangliers ont encore mâchonné les pages de sa vieille chanson de marin. Elle dit qu’un coffre dort là où se croisent les ombres de trois chênes. Il faut reprendre les pages, creuser au bon endroit et chasser le vieux sanglier qui dort dessus.',
    steps: [
      {
        k: 'loot',
        n: 4,
        mobs: ['Sanglier'],
        icon: '📜',
        item: 'Page de chanson mâchonnée',
        text: 'Reprendre aux sangliers les pages de la chanson'
      },
      { k: 'spot', at: [2, 1], text: 'Trouver où se croisent les ombres des trois arbres et creuser (E)' },
      {
        k: 'hunt',
        mob: 'Sanglier',
        title: 'Dent-de-Cale, le gardien du coffre',
        at: [2, 2],
        icon: '🐗',
        label: 'Ouvrir le coffre',
        text: 'Vaincre le vieux sanglier qui dormait sur le coffre'
      }
    ],
    reward: { gold: 40, item: 'Rare', text: 'Le coffre secret (équipement Rare de ton niveau)' },
    talk: {
      offer: [
        'Ils disent que mon trésor n’existe pas. Pfff. La vieille chanson dit : « Là où trois ombres se tiennent la main, dort le coffre du marin. »',
        'La preuve ? Un sanglier l’a mangée. Enfin, presque toute. Retrouve les pages, suis l’ombre des trois chênes, et creuse !'
      ],
      active:
        'Reprends les pages aux sangliers, puis regarde les ombres des trois chênes : elles se croisent juste au-dessus du coffre.',
      ready:
        'Un coffre ! Encore un ! La chanson a plus de couplets que je ne croyais. Garde ce qu’il contient, moi je veux juste voir leur tête au camp.',
      after:
        'Chaque couplet de la chanson cache un coffre. Je dépose une demande à la guilde dès que je trouve le suivant.'
    }
  },
  {
    id: 5,
    chapter: 0,
    main: false,
    title: 'Le poisson du vieux pêcheur',
    npc: 'eloi',
    site: 'q5',
    level: 7,
    summary:
      'Éloi, vieux pêcheur des Plaines verdoyantes : le poisson doré de son étang ne mord qu’au poisson frais, et seulement quand une onde brille d’or. Il lui faut trois poissons pour l’appât, puis quelqu’un qui sache ferrer au bon moment.',
    steps: [
      {
        k: 'work',
        job: 'fish',
        n: 3,
        text: 'Pêcher trois poissons pour l’appât, dans n’importe quelle eau'
      },
      {
        k: 'timing',
        text: 'Observer les ondulations de l’étang et pêcher le poisson doré (E au bon remous)'
      }
    ],
    reward: {
      gold: 50,
      fishXp: 120,
      recipe: 'dore',
      goldenFish: 2,
      text: 'Expérience de pêche, recette « Poisson doré en croûte de sel »'
    },
    talk: {
      offer: [
        'Le poisson doré ne mord pas au ver. Il lui faut du poisson frais. Trois prises, pêchées de ta main.',
        'Ensuite, regarde mon étang : quand une onde brille d’or, il est dessous. Approche-toi de ce remous et ferre (E) pendant qu’il brille !'
      ],
      active:
        'Trois poissons pour l’appât, pêchés n’importe où. Ensuite, regarde mon étang : quand un remous brille d’or, approche-toi et ferre (E).',
      ready:
        'Tu l’as eu ! Il y en a toujours un autre dans cet étang, tu sais. C’est pour ça que je reviens chaque matin.',
      after: 'Le poisson doré revient toujours. Quand il se montre, je fais passer le mot à la guilde.'
    }
  }
];
