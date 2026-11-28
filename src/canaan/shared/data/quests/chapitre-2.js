// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre II : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 6,
    chapter: 1,
    main: true,
    title: 'La mélodie des anciens',
    npc: 'sylva',
    site: 'q6',
    requires: 2,
    level: 12,
    summary:
      'Le Sanctuaire des Murmures, où dormait la première étoile, ne s’ouvre qu’à la mélodie des anciens. Mais des araignées étouffent la forêt sous leurs toiles.',
    steps: [
      {
        k: 'kill',
        n: 8,
        mobs: ['Araignée'],
        what: 'Araignée vaincue',
        text: 'Chasser les araignées de la forêt'
      },
      {
        k: 'pick',
        n: 4,
        spread: [4, 9],
        art: 'cocoon',
        icon: '🕸️',
        item: 'Cocon déchiré',
        label: 'Déchirer le cocon',
        ambush: ['Araignée', 1],
        text: 'Libérer les oiseaux chanteurs pris dans les cocons'
      },
      { k: 'collect', n: 4, text: 'Retrouver les quatre pierres musicales dans la forêt' },
      { k: 'puzzle', text: 'Jouer la mélodie des anciens sur le cercle de pierres' }
    ],
    reward: { gold: 120, flags: ['sanct_murmures'], text: 'Accès au Sanctuaire des Murmures' },
    talk: {
      offer: [
        'Orven t’envoie ? Alors tu cherches la première étoile. Elle dormait dans le Sanctuaire des Murmures, et le sanctuaire ne s’ouvre qu’à la mélodie des anciens.',
        'Mais les araignées ont tout envahi, comme si quelqu’un le leur avait demandé. Chasse-les, libère les oiseaux chanteurs pris dans leurs cocons, retrouve les quatre pierres musicales, puis joue au cercle : la plus grave, la plus aiguë, puis les deux du milieu, de la plus grave à la plus aiguë.'
      ],
      active:
        'Grave, aiguë, puis les deux du milieu de la plus grave à la plus aiguë. Écoute bien chaque pierre.',
      ready:
        'Le sanctuaire s’ouvre ! Mais l’autel est vide… L’étoile n’est plus là. Les arbres murmurent un nom : Aelor. Il veille sur l’arbre gardien aux racines d’or. Si quelqu’un sait où l’étoile est partie, c’est lui.',
      after:
        'L’étoile a quitté le sanctuaire. Va voir Aelor, près de l’arbre gardien aux racines d’or, dans la Forêt ancienne.'
    }
  },
  {
    id: 7,
    chapter: 1,
    main: true,
    title: 'Le gardien aux racines d’or',
    npc: 'aelor',
    site: 'q7',
    requires: 6,
    level: 16,
    summary:
      'L’arbre gardien a recueilli la première étoile. Il dépérit : des gobelins le saignent la nuit et vendent sa sève d’or à la femme voilée.',
    steps: [
      {
        k: 'loot',
        n: 6,
        mobs: ['Gobelin'],
        icon: '🏺',
        item: 'Fiole de sève d’or',
        text: 'Reprendre la sève d’or aux gobelins'
      },
      {
        k: 'wave',
        waves: [3, 4, 5],
        mobs: ['Gobelin', 'Ours'],
        what: 'l’arbre gardien',
        icon: '🌳',
        art: 'roots',
        at: [2, 0],
        label: 'Verser la sève aux racines',
        text: 'Défendre l’arbre gardien pendant qu’il boit sa sève',
        world: ['goldtree']
      },
      { k: 'guardian', text: 'Vaincre Sylvenoir, l’écho de la forêt (E sur le sceau)' },
      { k: 'reach', at: [2, -1], text: 'Écouter l’arbre gardien' }
    ],
    reward: {
      gold: 160,
      flags: ['blessing', 'star1'],
      text: 'Bénédiction des racines d’or (cosmétique) et première étoile'
    },
    talk: {
      offer: [
        'La première étoile ? Elle s’est réfugiée dans l’arbre gardien, quand le sanctuaire s’est tu. Mais l’arbre dépérit : les gobelins percent son écorce et vendent sa sève à une femme voilée.',
        'Reprends la sève aux gobelins et verse-la à ses racines. Ils reviendront la chercher : tiens bon le temps qu’il la boive. Quand il aura repris des forces, il te confiera l’étoile.'
      ],
      active:
        'Les gobelins rôdent partout dans la Forêt ancienne. La sève brille dans leurs fioles, tu ne peux pas la manquer.',
      ready:
        'Il t’a parlé, et il t’a confié l’étoile. Une sur six ! La femme voilée s’appelle Vesper, dit l’arbre, et elle veut éteindre les étoiles. La deuxième dort dans le marais, au Sanctuaire des Reflets. Maëline y entretient les lanternes : elle te montrera le chemin.',
      after:
        'Une étoile sur six. La suivante dort au Sanctuaire des Reflets, dans le Marais brumeux. Va voir Maëline et ses lanternes.'
    },
    verse: 'La racine écoute, la feuille répond, l’or coule en silence sous les troncs profonds.',
    memory:
      'L’arbre gardien : « Petite étincelle, te voilà revenue. Une autre est venue avant toi, la voilée. Elle chantait, jadis. Maintenant elle cherche les étoiles pour les éteindre. Trouve-les avant elle. »'
  },
  {
    id: 8,
    chapter: 1,
    main: false,
    title: 'Le chemin des lucioles',
    npc: 'nima',
    site: 'q8',
    level: 13,
    summary:
      'Nima, de la Forêt ancienne : les fées ont encore retourné les panneaux du bosquet, et les voyageurs s’y perdent. Seules les lucioles connaissent le vrai chemin : il faut en attraper trois et les suivre jusqu’à la pierre de passage.',
    steps: [
      {
        k: 'chase',
        n: 3,
        art: 'firefly',
        who: 'Luciole farceuse',
        label: 'Attraper la luciole',
        at: [0, 10],
        text: 'Attraper trois lucioles farceuses devant le bosquet'
      },
      {
        k: 'reach',
        at: [0, -8],
        text: 'Traverser le labyrinthe en suivant les lucioles (pas les panneaux)'
      }
    ],
    reward: {
      gold: 90,
      flags: ['shortcut'],
      text: 'Raccourci forestier : une pierre de passage vers le Camp de l’Aurore'
    },
    talk: {
      offer: [
        'Ce bosquet est un labyrinthe. Les panneaux ? Une farce des fées : ils mentent tous.',
        'Attrape trois lucioles et elles t’aideront. Suis-les jusqu’à la vieille pierre de passage, de l’autre côté.'
      ],
      active:
        'Attrape trois lucioles devant le bosquet, puis suis-les. Surtout, ne lis pas les panneaux : les fées les ont retournés.',
      ready:
        'Te voilà de l’autre côté ! La pierre de passage te ramène au camp quand tu veux (E). Les fées vont encore bouder.',
      after:
        'Les fées retournent les panneaux tous les quelques jours. Si le bosquet se remet à mentir, je préviendrai la guilde.'
    }
  },
  {
    id: 9,
    chapter: 1,
    main: false,
    title: 'Le voleur invisible',
    npc: 'brin',
    site: 'q9',
    level: 15,
    summary:
      'Brin, voyageur de la Forêt ancienne : ses provisions disparaissent chaque nuit, et il ne voit que de toutes petites empreintes. Il faut suivre la piste, attraper le voleur et décider de son sort.',
    steps: [
      { k: 'trail', text: 'Suivre les petites empreintes (elles n’apparaissent que de près)' },
      {
        k: 'chase',
        n: 1,
        art: 'thief',
        who: 'Le voleur',
        label: 'Attraper le voleur',
        at: [5, -4],
        text: 'Rattraper le voleur avant qu’il ne disparaisse'
      },
      { k: 'choice', text: 'Décider du sort du petit voleur' }
    ],
    reward: { gold: 110, item: 'Rare', text: 'Or et équipement Rare de ton niveau' },
    talk: {
      offer: [
        'On me vole mes provisions ! Des pommes, du fromage, même mes biscuits au miel.',
        'Je ne vois jamais personne. Mais il y a de toutes petites empreintes… Tu veux bien enquêter ?'
      ],
      active:
        'Les empreintes partent de mon sac. Regarde par terre, de près : elles n’apparaissent qu’à quelques pas.',
      ask: 'Un… caméléon-renard ? Avec les joues pleines de mon miel ? Dis-moi, toi qui l’as attrapé : j’en fais quoi ?',
      ready: 'Bon, c’est décidé. Merci d’avoir tiré ça au clair : la guilde te paiera pour moi.',
      after: 'Le petit voleur vient manger dans ma main maintenant. On est amis.',
      afterChoice: [
        'Le petit voleur vient manger dans ma main maintenant. On est amis.',
        'Il travaille pour payer ses dettes : il garde mon sac. Je n’ai jamais eu de meilleur gardien.'
      ]
    },
    choices: ['Lui laisser un biscuit chaque soir', 'L’engager comme gardien du sac']
  },
  {
    id: 10,
    chapter: 1,
    main: false,
    title: 'Le peintre des ombres',
    npc: 'theon',
    site: 'q10',
    level: 17,
    summary:
      'Théon, peintre de la Forêt ancienne : d’un endroit précis, l’ombre de son vieil arbre prend la forme d’un oiseau. Pour la peindre, il lui faut des herbes pour ses couleurs, des poils de chauve-souris pour ses pinceaux, et quelqu’un pour retrouver le bon endroit.',
    steps: [
      { k: 'work', job: 'herb', n: 3, text: 'Cueillir trois herbes pour les pigments' },
      {
        k: 'loot',
        n: 5,
        mobs: ['Chauve-souris'],
        icon: '🖌️',
        item: 'Touffe de poils fins',
        text: 'Prendre des poils de chauve-souris pour les pinceaux'
      },
      {
        k: 'spot',
        at: [-1, -3],
        text: 'Trouver le point d’observation où l’ombre de l’arbre devient un oiseau (E)'
      }
    ],
    reward: { gold: 90, item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Un jour, d’un endroit précis, l’ombre de ce vieil arbre est devenue un oiseau. Un oiseau parfait !',
        'Il me faut des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Et l’endroit : « au nord de l’arbre, un pas à l’ouest ». Appelle-moi (E) quand tu y es.'
      ],
      active:
        'Des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Puis l’endroit : au nord de l’arbre, un pas à l’ouest. Appelle-moi (E) quand tu y es.',
      ready:
        'Le voilà, mon oiseau d’ombre ! Il change avec les saisons, alors je le repeins souvent. Merci, l’ami.',
      after:
        'L’ombre de l’arbre change avec la lumière. Quand mes couleurs s’épuisent, je repasse par la guilde.'
    }
  }
];
