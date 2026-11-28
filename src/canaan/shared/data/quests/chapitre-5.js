// @ts-check
// Histoire « Les Échos de l'Aurore », chapitre V : ses quêtes (PNJ, lieu, objectifs, dialogues, récompense).
// Rassemblées et gelées dans shared/data/quests.js (QUESTS), avec les autres chapitres, l'Interlude et les contrats ;
// export par défaut, comme les fiches de shared/data/dungeons/ : rien d'autre n'est exposé au jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default [
  {
    id: 21,
    chapter: 4,
    main: true,
    title: 'La cité sous les sables',
    npc: 'sahir',
    site: 'q21',
    requires: 17,
    level: 42,
    summary:
      'Trois obélisques gardent l’entrée de la Cité des Étoiles, où dorment la quatrième étoile et la machine des anciens. Les morts de la cité en barrent la route.',
    steps: [
      {
        k: 'kill',
        n: 10,
        mobs: ['Squelette'],
        what: 'Veilleur renvoyé au sable',
        text: 'Renvoyer au sable les veilleurs de la cité'
      },
      {
        k: 'pick',
        n: 3,
        at: [
          [-5, 0],
          [5, 0],
          [0, 5]
        ],
        art: 'obelisk',
        keep: true,
        icon: '🗿',
        item: 'Obélisque dégagé',
        label: 'Dégager l’obélisque',
        ambush: ['Squelette', 2],
        text: 'Dégager les trois obélisques ensevelis'
      },
      {
        k: 'hunt',
        mob: 'Chevalier déchu',
        title: 'Rakhem, le gardien sans visage',
        at: [0, 1],
        icon: '✦',
        label: 'Poser la main sur l’étoile gravée',
        text: 'Vaincre le gardien qui barre l’escalier',
        world: ['cite', 'sanct_etoiles']
      }
    ],
    reward: {
      gold: 380,
      flags: ['star4', 'sanct_etoiles'],
      text: 'Quatrième étoile et accès à la Cité des Étoiles'
    },
    talk: {
      offer: [
        'La Cité des Étoiles ? Trois obélisques en gardent l’entrée, sous le sable. La quatrième étoile y dort, et la machine des anciens aussi.',
        'Mais les morts se sont relevés depuis le passage de la Confrérie. Renvoie-les au sable, dégage les trois obélisques et vaincs le gardien de l’escalier.'
      ],
      active:
        'Les squelettes ne sont pas cruels. Ils obéissent à un ordre vieux de mille ans : « Ne laissez entrer personne. »',
      ready:
        'Le sable s’effondre… un escalier ! La Cité des Étoiles, et sa lumière : la quatrième étoile ! Quatre sur six. En bas, Astéria étudie la vieille machine. Elle a besoin de toi pour la faire parler.',
      after:
        'Quatre étoiles sur six. Descends dans la Cité des Étoiles : Astéria t’y attend avec la machine des anciens.'
    }
  },
  {
    id: 22,
    chapter: 4,
    main: true,
    title: 'La machine de l’Aurore',
    npc: 'asteria',
    site: 'q22',
    requires: 21,
    level: 47,
    summary:
      'Sous la Cité des Étoiles, une machine des anciens sait comment réveiller le Cœur. Il lui faut du verre solaire, et quelqu’un pour la défendre quand elle s’éveille.',
    steps: [
      {
        k: 'loot',
        n: 4,
        mobs: ['Drake des dunes'],
        icon: '🔶',
        item: 'Écaille de verre solaire',
        text: 'Prendre des écailles de verre aux drakes des dunes'
      },
      {
        k: 'pick',
        n: 3,
        at: [
          [-2, 3],
          [0, 3],
          [2, 3]
        ],
        art: 'lever',
        keep: true,
        icon: '⚙️',
        item: 'Anneau lancé',
        label: 'Lancer l’anneau',
        ambush: ['Scorpion', 2],
        text: 'Lancer les trois anneaux de la machine'
      },
      {
        k: 'wave',
        waves: [3, 4, 5],
        mobs: ['Scorpion', 'Squelette', 'Minotaure'],
        what: 'la machine',
        icon: '⚙️',
        art: 'barrel',
        at: [0, 4],
        label: 'Allumer la machine',
        text: 'Défendre la machine pendant qu’elle chauffe',
        world: ['machine']
      },
      { k: 'guardian', text: 'Vaincre Sablamort, l’écho des dunes (E sur le sceau)' }
    ],
    reward: {
      gold: 460,
      flags: ['star5'],
      item: 'Épique',
      text: 'Cinquième étoile et la salle du trésor (équipement Épique)'
    },
    talk: {
      offer: [
        'Cette machine a été faite pour une seule chose : dire comment réveiller le Cœur. Trois anneaux, six symboles chacun. Quand ils tournent ensemble, elle parle.',
        'Il lui faut du verre solaire, et les drakes des dunes le portent sur le dos. Une fois lancée, elle fera du bruit. Beaucoup de bruit. Tout le désert viendra : il faudra la défendre.'
      ],
      active: 'Les drakes des dunes muent souvent. Ceux qui muent sont de mauvaise humeur.',
      ready:
        'Elle parle : « Réunissez les six étoiles dans le sanctuaire central, et qu’une étincelle du Cœur chante avec elles. » Une étincelle du Cœur… c’est Lumi ! La cinquième étoile était dans la machine : cinq sur six. Lumi connaît le chemin du sanctuaire central, dans la Forêt enchantée. Et Vesper aussi, maintenant : elle écoutait derrière un pilier.',
      after:
        'Cinq étoiles sur six. Suis Lumi dans la Forêt enchantée, jusqu’au Sanctuaire des Six Lumières. Vesper y va aussi.'
    },
    verse: 'Le sable a tout bu, sauf l’étoile et le soir ; marche, voyageur, la nuit n’est pas le noir.',
    memory:
      'La machine de l’Aurore : pour réveiller le Cœur, il faut réunir les six étoiles dans le sanctuaire central, puis qu’une étincelle du Cœur lui-même chante avec elles. Derrière un pilier, une femme voilée écoutait. Elle est partie sans se battre.'
  },
  {
    id: 23,
    chapter: 4,
    main: false,
    title: 'Le marchand qui vendait du vent',
    npc: 'zafir',
    site: 'q23',
    level: 43,
    summary:
      'Zafir, marchand du Désert oublié, vend du vent en bouteille. Ses tourbillons se sont échappés, les drakes des dunes les avalent, et il veut offrir une bouteille de brise à Amira, à l’oasis, pour se faire pardonner une vieille dette.',
    steps: [
      {
        k: 'chase',
        n: 4,
        art: 'whirl',
        who: 'Tourbillon',
        label: 'Mettre en bouteille',
        text: 'Remettre quatre tourbillons en bouteille'
      },
      {
        k: 'kill',
        n: 6,
        mobs: ['Drake des dunes'],
        what: 'Drake mis en fuite',
        text: 'Éloigner les drakes qui respirent la marchandise'
      },
      {
        k: 'talk',
        npc: 'amira',
        lines: [
          'Une bouteille de brise, de la part de Zafir ? Il me doit de l’argent depuis trois ans, et il m’envoie du vent.',
          'Oh… mais c’est du vrai. Il sent la mer. Dis-lui que nous sommes quittes. Et que… non, rien. Dis-lui juste merci.'
        ],
        text: 'Livrer une bouteille de brise à Amira, à l’oasis'
      }
    ],
    reward: { gold: 330, item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Du vent du nord, du sud, de l’est, de l’ouest ! Tu ne me crois pas ? Regarde-le courir, il s’est échappé !',
        'Rattrape mes tourbillons, éloigne les drakes qui les respirent, et porte une bouteille à Amira. Discrètement. C’est un cadeau.'
      ],
      active:
        'Remets mes tourbillons en bouteille, chasse les drakes qui les avalent, puis porte une bouteille de brise à Amira, à l’oasis. Discrètement : c’est un cadeau.',
      ready:
        'Elle a souri ? Elle a SOURI ? Je lui en enverrai une autre à la prochaine lune. Merci, l’ami du vent.',
      after: 'Chaque lune, j’envoie une bouteille à Amira. Et chaque lune, mes tourbillons s’échappent.'
    }
  },
  {
    id: 24,
    chapter: 4,
    main: false,
    title: 'Le temple des miroirs',
    npc: 'noura',
    site: 'q24',
    level: 46,
    summary:
      'Noura, prêtresse du Désert oublié : le sable a encore dérangé les miroirs du petit temple, et sa porte ne s’ouvre qu’au rayon du soleil. Il faut orienter les miroirs, puis calmer Néfer, la gardienne, que la lumière réveille.',
    steps: [
      { k: 'puzzle', text: 'Orienter les miroirs pour diriger le rayon solaire sur la porte' },
      {
        k: 'hunt',
        mob: 'Squelette',
        title: 'Néfer, la gardienne du rayon',
        at: [2, -2],
        icon: '☀️',
        label: 'Franchir la porte',
        text: 'Vaincre la gardienne du temple'
      }
    ],
    reward: { gold: 360, item: 'Épique', text: 'Le coffre du temple (équipement Épique)' },
    talk: {
      offer: [
        'Ce temple garde un coffre depuis mille ans. Sa porte attend un rayon de soleil.',
        'Quatre miroirs, un rayon. Tourne-les (E), et suis la lumière jusqu’au soleil gravé sur la porte. Puis salue Néfer. Elle déteste être réveillée.'
      ],
      active:
        'Tourne les miroirs (E) et suis le rayon depuis la pierre solaire jusqu’au soleil de la porte. Puis calme Néfer : elle déteste être réveillée.',
      ready:
        'La porte est ouverte et Néfer dort de nouveau. Les tempêtes déplacent les miroirs à chaque saison : reviens quand la guilde t’enverra.',
      after: 'Je prie ici chaque matin. Quand une tempête dérange les miroirs, j’écris à la guilde.'
    }
  },
  {
    id: 25,
    chapter: 4,
    main: false,
    title: 'Le secret de l’oasis',
    npc: 'amira',
    site: 'q25',
    level: 48,
    summary:
      'Amira, de l’oasis du Désert oublié : les scorpions ont encore fait leurs nids dans l’aqueduc, l’eau n’arrive plus et les porteurs n’osent plus sortir. Il faut chasser les scorpions, détruire les nids et escorter un porteur jusqu’au bassin.',
    steps: [
      {
        k: 'kill',
        n: 10,
        mobs: ['Scorpion'],
        what: 'Scorpion vaincu',
        text: 'Chasser les scorpions de l’oasis'
      },
      {
        k: 'pick',
        n: 4,
        spread: [4, 8],
        art: 'nest',
        icon: '🦂',
        item: 'Nid détruit',
        label: 'Détruire le nid',
        ambush: ['Scorpion', 2],
        text: 'Détruire les nids qui bouchent l’aqueduc'
      },
      {
        k: 'escort',
        art: 'person',
        look: { sex: 'm', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' },
        who: 'Porteur d’eau',
        from: [-5, -3],
        to: [2, 1],
        ambush: [
          ['Scorpion', 2],
          ['Drake des dunes', 1]
        ],
        label: 'Accompagner le porteur',
        text: 'Escorter le porteur d’eau jusqu’au bassin',
        world: ['oasis']
      }
    ],
    reward: { gold: 380, recipe: 'tajine', text: 'Recette « Tajine de l’oasis » et oasis restaurée' },
    talk: {
      offer: [
        'L’eau n’arrive plus. Les scorpions ont fait leurs nids dans les conduits, et mes porteurs refusent de sortir.',
        'Nettoie l’aqueduc, puis accompagne le dernier porteur courageux jusqu’au bassin. Une seule jarre suffira : l’eau appelle l’eau.'
      ],
      active: 'Un nid détruit, c’est une colère réveillée. Garde ton arme en main.',
      ready:
        'L’eau chante dans le bassin ! Les scorpions reviendront avec la saison sèche, mais aujourd’hui l’oasis respire. Merci, l’ami de l’eau.',
      after:
        'Les palmiers reverdissent. À la saison sèche, les scorpions reviennent toujours : la guilde le saura.'
    }
  }
];
