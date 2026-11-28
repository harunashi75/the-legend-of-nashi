// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre III : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 11,
    chapter: 2,
    main: true,
    title: 'Les lanternes perdues',
    npc: 'maeline',
    site: 'q11',
    requires: 7,
    level: 22,
    summary:
      'Les lanternes de Maëline guidaient les voyageurs jusqu’au Sanctuaire des Reflets, où dort la deuxième étoile. Elles se sont toutes éteintes en une nuit.',
    steps: [
      {
        k: 'loot',
        n: 6,
        mobs: ['Wisp'],
        icon: '🔥',
        item: 'Flamme volée',
        text: 'Reprendre les flammes volées par les feux follets'
      },
      {
        k: 'pick',
        n: 4,
        at: [
          [-3, -2],
          [-1, -3],
          [1, -3],
          [3, -2]
        ],
        art: 'lantern',
        keep: true,
        icon: '🏮',
        item: 'Lanterne rallumée',
        label: 'Rallumer la lanterne',
        ambush: ['Wisp', 1],
        text: 'Rallumer les quatre lanternes'
      },
      {
        k: 'wave',
        waves: [3, 4, 5],
        mobs: ['Wisp', 'Mante des roseaux', 'Araignée venimeuse'],
        what: 'les lanternes',
        icon: '🏮',
        art: 'lantern',
        at: [0, 1],
        label: 'Lever la grande lanterne',
        text: 'Défendre les lanternes jusqu’à l’aube',
        world: ['lanterns', 'sanct_reflets']
      }
    ],
    reward: { gold: 200, flags: ['sanct_reflets'], text: 'Passage vers le Sanctuaire des Reflets' },
    talk: {
      offer: [
        'Tu cherches le Sanctuaire des Reflets ? Mes lanternes en montraient le chemin. Elles se sont toutes éteintes la même nuit, et trois voyageurs ne sont pas rentrés.',
        'Les feux follets ont avalé leurs flammes. Reprends-les-leur, rallume les quatre lanternes, et défends-les jusqu’à l’aube : le marais n’aime pas la lumière.'
      ],
      active: 'Une flamme avalée par un feu follet ne s’éteint pas. Il faut seulement la lui reprendre.',
      ready:
        'Elles brillent toutes ! J’ai vu des silhouettes au visage voilé s’enfuir : Vesper n’est plus seule. Et regarde, les lanternes tracent le chemin du Sanctuaire des Reflets. Néris garde ses vieux miroirs : elle t’attend là-bas.',
      after: 'Le chemin du Sanctuaire des Reflets est éclairé. Néris t’attend près des vieux miroirs.'
    },
    memory:
      'Dans la boue, une broche en forme de voile. Vesper n’est plus seule : des gens la suivent et se font appeler la Confrérie du Voile.'
  },
  {
    id: 12,
    chapter: 2,
    main: true,
    title: 'Le miroir des souvenirs',
    npc: 'neris',
    site: 'q12',
    requires: 11,
    level: 26,
    summary:
      'Les miroirs du Sanctuaire des Reflets montraient le passé. Les Voilés les ont brisés pour cacher la vérité sur Vesper. La deuxième étoile est derrière eux.',
    steps: [
      {
        k: 'pick',
        n: 4,
        spread: [4, 9],
        icon: '🪞',
        item: 'Éclat de miroir',
        label: 'Ramasser l’éclat',
        ambush: ['Basilic', 1],
        text: 'Retrouver les éclats des miroirs brisés'
      },
      {
        k: 'pick',
        n: 4,
        at: [
          [-3, -1],
          [-1, -1],
          [1, -1],
          [3, -1]
        ],
        art: 'frame',
        keep: true,
        icon: '🪞',
        item: 'Miroir réparé',
        label: 'Réparer le miroir',
        panels: [
          'Le premier miroir : les anciens chantent autour du Cœur de l’Aurore. Deux voix mènent le chœur, un frère et une sœur. Auralis et Vesper.',
          'Le deuxième miroir : une ombre immense monte de la mer. Elle se nourrit de lumière. Vesper est la seule à ne pas reculer : elle écoute.',
          'Le troisième miroir : le Cœur se brise en six étoiles pour échapper à l’Ombre. Vesper hurle. On ne l’a pas prévenue.',
          'Le dernier miroir : six sanctuaires s’allument sur l’île. Vesper est restée du mauvais côté de la mer, seule avec l’Ombre.'
        ],
        text: 'Remettre les éclats dans leurs cadres et regarder'
      },
      {
        k: 'hunt',
        mob: 'Spectre',
        title: 'Le Reflet menteur',
        at: [0, 2],
        icon: '🪞',
        label: 'Regarder ton reflet',
        text: 'Affronter le reflet qui ne te ressemble pas'
      },
      { k: 'guardian', text: 'Vaincre Miroitombe, l’écho des reflets (E sur le sceau)' }
    ],
    reward: { gold: 240, flags: ['star2'], text: 'Deuxième étoile et un souvenir dans le journal' },
    talk: {
      offer: [
        'Ces miroirs se souvenaient de tout. Une nuit, des hommes voilés les ont brisés, un par un. Ils ne voulaient pas qu’on voie ce qu’ils montrent : l’histoire de Vesper.',
        'Retrouve les éclats et remets-les dans leurs cadres. Quand les miroirs seront entiers, le sanctuaire te rendra la deuxième étoile. Méfie-toi : un miroir brisé a parfois un reflet qui ne te ressemble pas.'
      ],
      active: 'Les basilics adorent ce qui brille. Méfie-toi quand tu ramasses un éclat.',
      ready:
        'Alors c’était ça… Vesper chantait avec les anciens. Ils ont endormi le Cœur pour le sauver, et ils l’ont oubliée au large. Elle croit qu’on l’a trahie. Voici la deuxième étoile : deux sur six. La troisième dort dans la Forêt automnale, où Érable garde un village oublié.',
      after:
        'Deux étoiles sur six. La troisième est dans la Forêt automnale : Érable t’y attend, dans les ruines du village aux feuilles dorées.'
    },
    verse: 'L’eau garde un visage que l’eau n’a pas pris ; qui regarde longtemps s’y trouve, et sourit.',
    memory:
      'Le miroir des souvenirs : les anciens vivaient en paix autour du Cœur de l’Aurore, guidés par deux chanteurs, Auralis et sa sœur Vesper. Une ombre est venue de la mer. Ils ont brisé le Cœur en six étoiles pour le sauver. Vesper, restée au large, a entendu le silence tomber. Elle n’a jamais su que c’était un sacrifice. Elle a cru à une trahison.'
  },
  {
    id: 13,
    chapter: 2,
    main: false,
    title: 'Le pont qui ne tient jamais',
    npc: 'goran',
    site: 'q13',
    level: 23,
    summary:
      'Goran, bâtisseur du Marais brumeux : les bêtes du marais rongent encore son pont. Il lui faut des planches échouées, des tendons de mante pour les cordes, et quelqu’un pour tenir les bêtes à distance pendant qu’il cloue.',
    steps: [
      {
        k: 'pick',
        n: 6,
        spread: [6, 11],
        art: 'plank',
        icon: '🪵',
        item: 'Planche solide',
        label: 'Ramasser la planche',
        text: 'Ramasser des planches échouées autour de l’étang'
      },
      {
        k: 'loot',
        n: 5,
        mobs: ['Mante des roseaux'],
        icon: '🧵',
        item: 'Tendon de mante',
        text: 'Prendre des tendons de mante pour les cordes'
      },
      {
        k: 'wave',
        waves: [3, 4],
        mobs: ['Mante des roseaux', 'Basilic'],
        what: 'le pont',
        icon: '🔨',
        art: 'barrel',
        at: [-4, 1],
        label: 'Commencer les travaux',
        text: 'Défendre le pont pendant que Goran cloue',
        world: ['bridge']
      }
    ],
    reward: { gold: 160, flags: ['bridge'], text: 'Le pont restauré pour toujours' },
    talk: {
      offer: [
        'Mon pont ? Une catastrophe. Onze fois que je le reconstruis. Onze fois !',
        'Cette fois, on fait ça bien : de vraies planches, de vraies cordes. Et toi, avec ton arme, entre les bêtes et moi pendant que je cloue.'
      ],
      active:
        'Des planches bien droites autour de l’étang, des tendons de mante pour les cordes. Ensuite, reste entre les bêtes et moi pendant que je cloue.',
      ready: 'Il tient ! Encore une fois ! Les mantes finiront par se lasser avant moi. Merci, l’ami.',
      after: 'Le Pont qui Tient tient… jusqu’à la prochaine mante affamée. Je laisserai un mot à la guilde.'
    }
  },
  {
    id: 14,
    chapter: 2,
    main: false,
    title: 'Le fantôme qui avait oublié son nom',
    npc: 'esprit',
    site: 'q14',
    level: 25,
    summary:
      'Un esprit amical erre dans le Marais brumeux. Il oublie son nom à chaque nouvelle lune, et sans nom il ne peut pas faire sa tournée. Il faut interroger les habitants et les objets du marais, lui rendre son nom et l’accompagner.',
    steps: [
      { k: 'clues', n: 4, text: 'Interroger les habitants et examiner les objets du marais (4 indices)' },
      { k: 'choice', text: 'Rendre son nom à l’esprit' },
      {
        k: 'escort',
        art: 'ghost',
        who: 'Ilian',
        from: [0, -2],
        to: [0, 12],
        ambush: [
          ['Wisp', 2],
          ['Wisp', 3]
        ],
        label: 'Accompagner Ilian',
        text: 'Accompagner Ilian pour sa dernière tournée'
      }
    ],
    reward: { gold: 150, item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Bouuh… pardon. Je ne voulais pas te faire peur. J’ai oublié mon nom, tu sais. Ça arrive, quand on est mort depuis longtemps.',
        'Les gens d’ici et les objets du marais se souviennent peut-être de moi. Tu veux bien chercher ?'
      ],
      active:
        'Une lanterne, une barque, un vieux chapeau… et les habitants. Quelqu’un se souvient forcément.',
      ask: 'Alors… tu sais qui j’étais ?',
      ready:
        'Ilian le lanternier. Oui, c’était moi. Merci d’avoir fait la tournée avec moi. À la prochaine lune, je l’aurai sans doute encore oublié…',
      after:
        'Je m’appelle… Ilian, je crois. À chaque nouvelle lune, ça m’échappe encore. Si je l’oublie, la guilde saura où me trouver.'
    },
    choices: ['Orrin le passeur', 'Ilian le lanternier', 'Barnabé le pêcheur', 'Silas le chapelier'],
    answer: 1
  },
  {
    id: 15,
    chapter: 2,
    main: false,
    title: 'La traversée des nénuphars',
    npc: 'pipo',
    site: 'q15',
    level: 27,
    summary:
      'Pipo, enfant du Marais brumeux : Gobe-Tout, le vieux basilic de l’étang, a encore avalé la clé du coffre de l’îlot. Il faut attirer le basilic en chassant les siens, le vaincre pour reprendre la clé, puis traverser sur les nénuphars qui coulent.',
    steps: [
      {
        k: 'kill',
        n: 6,
        mobs: ['Basilic'],
        what: 'Basilic vaincu',
        text: 'Attirer le vieux basilic en chassant les siens'
      },
      {
        k: 'hunt',
        mob: 'Basilic',
        title: 'Gobe-Tout, le basilic glouton',
        at: [-5, -2],
        icon: '🗝️',
        label: 'Appeler Gobe-Tout',
        text: 'Vaincre Gobe-Tout et récupérer la clé'
      },
      {
        k: 'reach',
        at: [4, 0],
        text: 'Traverser l’étang sur les nénuphars sans t’arrêter et ouvrir le coffre de l’îlot'
      }
    ],
    reward: { gold: 120, item: 'Épique', text: 'Le coffre caché (équipement Épique de ton niveau)' },
    talk: {
      offer: [
        'Il y a un coffre sur l’îlot ! J’avais la clé, mais Gobe-Tout l’a gobée. Il gobe tout. C’est pour ça qu’il s’appelle comme ça.',
        'Après, saute de nénuphar en nénuphar sans t’arrêter. Si tu tombes, l’eau te ramène sur la rive. Promis, je ne rirai pas !'
      ],
      active:
        'Chasse les basilics pour faire sortir Gobe-Tout, reprends-lui la clé, puis saute de nénuphar en nénuphar sans t’arrêter !',
      ready:
        'Tu l’as fait ! Hi hi, tu sens le basilic. Gobe-Tout avale tout ce qui brille, alors il y aura sûrement une prochaine fois.',
      after: 'Je m’entraîne à sauter. Et Gobe-Tout a déjà avalé ma nouvelle clé…'
    }
  }
];
