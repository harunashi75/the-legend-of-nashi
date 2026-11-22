// @ts-check
// Interlude « Les Voix d'en bas » : les quêtes des Tréfonds, sous l'île (6 principales, 10 secondaires). Pour tous les
// niveaux : elles suivent celui du héros (scaled), comme les créatures des Tréfonds. Elles se jouent à côté de l'histoire
// de la surface, dès la première descente ; les quatre voix (32 à 35) se cherchent dans l'ordre qu'on veut.
// Mêmes objectifs que shared/data/quests.js. Lieux : under, avec fort (cases autour du centre de la forteresse) ou
// biome et cavern (caverne du plan de scripts/underground.js) et un décalage.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Chapitre de l'Interlude dans CHAPTERS (après les six de la surface).
export const INTERLUDE = 6;
export const INTERLUDE_SITES = deepFreeze({
  q31: { under: true, fort: [0, -3], r: 2 },
  q32: { under: true, biome: 0, cavern: 'village', r: 5 },
  q33: { under: true, biome: 1, cavern: 'village', r: 5 },
  q34: { under: true, biome: 2, cavern: 'village', r: 5 },
  q35: { under: true, biome: 3, cavern: 'village', r: 5 },
  q36: { under: true, biome: 2, cavern: 'deep', r: 5 },
  q37: { under: true, fort: [-4, 5], r: 2 },
  q38: { under: true, fort: [2, 3], r: 2 },
  q39: { under: true, fort: [-2, 13], r: 2 },
  q40: { under: true, fort: [9, 2], r: 2 },
  q41: { under: true, biome: 0, cavern: 'lake', r: 5 },
  q42: { under: true, biome: 1, cavern: 'lake', r: 5 },
  q43: { under: true, biome: 2, cavern: 'lake', r: 5 },
  q44: { under: true, biome: 3, cavern: 'lake', r: 5 },
  q45: { under: true, biome: 0, cavern: 'deep', r: 5 },
  q46: { under: true, biome: 3, cavern: 'deep', r: 5 }
});
// dwarfName : un nain de la forteresse ou un éclaireur (underground.js), à sa place ; dwarf : un autre nain, posé près du
// lieu ; mob : une créature amicale.
export const INTERLUDE_NPCS = deepFreeze({
  thrain: { name: 'Roi Thrain Barbe-de-Fer', site: 'q31', dwarfName: 'Roi Thrain Barbe-de-Fer' },
  nori: { name: 'Éclaireur Nori', site: 'q32', dwarfName: 'Éclaireur Nori' },
  disa: { name: 'Éclaireuse Dísa', site: 'q33', dwarfName: 'Éclaireuse Dísa' },
  oin: { name: 'Éclaireur Óin', site: 'q34', dwarfName: 'Éclaireur Óin' },
  thyra: { name: 'Éclaireuse Thyra', site: 'q35', dwarfName: 'Éclaireuse Thyra' },
  brunhild: { name: 'Ancienne Brunhild', site: 'q36', dwarfName: 'Ancienne Brunhild' },
  gloin: { name: 'Mineur Gloin', site: 'q37', dwarfName: 'Mineur Gloin' },
  fili: { name: 'Petit Fili', site: 'q38', dwarfName: 'Petit Fili' },
  balin: { name: 'Garde Balin', site: 'q39', dwarfName: 'Garde Balin' },
  dorn: { name: 'Dorn le Tavernier', site: 'q40', dwarfName: 'Dorn le Tavernier' },
  perrin: {
    name: 'Perrin l’Égaré',
    site: 'q41',
    at: [0, 2],
    look: { sex: 'm', race: 'humain', hair: '#c88a3a', outfit: 'rose' },
    tool: 'basket'
  },
  orsik: {
    name: 'Orsik le Sonneur',
    site: 'q42',
    at: [0, 2],
    ghost: true,
    dwarf: { beard: '#d8ecff', helm: '#8ac8e8', tunic: '#4a6a8a', tool: 'hammer', skin: '#c8e0f0' }
  },
  runa: {
    name: 'Sœur Runa',
    site: 'q43',
    at: [0, 2],
    dwarf: {
      beard: '#e8e0d0',
      helm: '#2a3a32',
      tunic: '#1a2a22',
      tool: 'lantern',
      fem: true,
      skin: '#e8b48a'
    }
  },
  girolle: {
    name: 'Girolle',
    site: 'q44',
    at: [0, 2],
    mob: 'Myconide',
    pal: ['#e8a84a', '#a86a1e', '#fff0c8', '#f0e0b8', '#3a2a10']
  },
  nog: {
    name: 'Grand-père Nog',
    site: 'q45',
    at: [0, 2],
    dwarf: { beard: '#f4f0e8', helm: '#5a3a5a', tunic: '#4a3a2a', tool: 'staff', skin: '#f0c7a0' }
  },
  bolet: {
    name: 'Bolet',
    site: 'q46',
    at: [0, 2],
    mob: 'Myconide',
    pal: ['#8a5ac8', '#4a2a7a', '#e8d8ff', '#e0d0f0', '#fff0a0']
  }
});
export const INTERLUDE_QUESTS = deepFreeze([
  {
    id: 31,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'La pierre qui chante',
    npc: 'thrain',
    site: 'q31',
    level: 1,
    summary:
      'Depuis la nuit où l’étoile est tombée, les pierres de Durgrim chantent. Le roi Thrain n’a pas dormi. La dernière fois que la pierre s’est réveillée, Khaz-Ombral s’est vidée en une nuit.',
    steps: [
      {
        k: 'talk',
        npc: 'brunhild',
        lines: [
          'Le roi t’envoie me demander si j’ai peur ? Non. J’ai déjà entendu ce chant. Ma grand-mère le fredonnait en tressant mes cheveux.',
          'Quatre pierres-voix gardent les portes de nos quatre royaumes. Pose ton oreille contre chacune. Si elles chantent la même chose, c’est un cri. Si elles se répondent… c’est une chanson.'
        ],
        text: 'Demander à l’Ancienne Brunhild ce qu’elle entend'
      },
      {
        k: 'pick',
        n: 4,
        caverns: [
          [0, 'gate'],
          [1, 'gate'],
          [2, 'gate'],
          [3, 'gate']
        ],
        art: 'voice',
        keep: true,
        icon: '🗿',
        item: 'Pierre-voix écoutée',
        label: 'Écouter la pierre-voix',
        panels: [
          'La pierre des Galeries gronde : trois notes lourdes, comme des coups de pioche. Puis elle attend.',
          'La pierre de Khaz-Ombral répond, de l’autre côté de la forteresse : trois notes claires, comme un marteau sur une cloche.',
          'La pierre de la Nécropole murmure sans jamais finir sa phrase. On dirait une liste de noms.',
          'La pierre de Fangeval ronronne. Elle est la seule à chanter juste, et elle a l’air de s’amuser.'
        ],
        text: 'Écouter les quatre pierres-voix, aux portes des quatre royaumes'
      },
      {
        k: 'kill',
        n: 8,
        mobs: [
          'Ver des boues',
          'Taupe-garou',
          'Scarabée foreur',
          'Gobelin des mines',
          'Sentinelle de pierre',
          'Spectre minier',
          'Squelette nain',
          'Gargouille',
          'Goule',
          'Âme errante',
          'Chevalier des tombes',
          'Corbeau des tombes',
          'Myconide',
          'Limace des fanges',
          'Mille-pattes géant',
          'Moustique des fanges'
        ],
        what: 'Créature repoussée',
        text: 'Repousser les créatures que le chant rend folles'
      }
    ],
    reward: { flags: ['deepsong'], text: 'Le chant des profondeurs dans le journal' },
    talk: {
      offer: [
        'Approche, voyageur. Pose la main sur ce pilier. Tu la sens, cette vibration ? Voilà trois semaines que mes murs fredonnent.',
        'Il y a mille ans, la pierre a chanté. Le lendemain, Khaz-Ombral était vide, et les bols de soupe encore tièdes. Je ne perdrai pas Durgrim. Va voir Brunhild : elle sait écouter.'
      ],
      active:
        'Aux quatre portes, il y a quatre pierres. Mon père m’interdisait de les toucher. Toi, tu n’es pas mon fils.',
      ready:
        'Elles se répondent ? Ce n’est donc pas un cri… Alors quelqu’un, en bas, essaie de nous parler. Mes éclaireurs sont postés dans les quatre royaumes : Nori, Dísa, Óin, Thyra. Trouve qui chante.',
      after: 'Quatre royaumes, quatre voix. Va dans l’ordre que tu veux : la pierre, elle, n’est pas pressée.'
    },
    memory:
      'Durgrim : la pierre ne crie pas, elle chante. Quatre voix se répondent sous l’île, et aucune ne connaît la fin de la chanson.'
  },
  {
    id: 32,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'La voix de l’argile',
    npc: 'nori',
    site: 'q32',
    requires: 31,
    level: 1,
    summary:
      'Dans les Galeries d’Argile, une équipe de mineurs a disparu en suivant le chant. Les gobelins des mines les ont trouvés avant Nori.',
    steps: [
      {
        k: 'kill',
        n: 8,
        mobs: ['Gobelin des mines', 'Scarabée foreur'],
        what: 'Ennemi des Galeries vaincu',
        text: 'Ouvrir la route : gobelins des mines et scarabées foreurs'
      },
      {
        k: 'pick',
        n: 4,
        spread: [4, 10],
        art: 'miner',
        icon: '⛏️',
        item: 'Mineur libéré',
        label: 'Libérer le mineur',
        ambush: ['Gobelin des mines', 1],
        text: 'Libérer les quatre mineurs enchaînés'
      },
      {
        k: 'hunt',
        mob: 'Gobelin des mines',
        title: 'Grik, le contremaître',
        at: [0, 0],
        adds: ['Gobelin des mines', 2],
        icon: '⛓️',
        label: 'Briser les chaînes de Grik',
        text: 'Vaincre Grik, le contremaître'
      }
    ],
    reward: {
      flags: ['voice1'],
      item: 'Rare',
      text: 'La voix de l’argile et un équipement Rare de ton niveau'
    },
    talk: {
      offer: [
        'Chut… Tu entends les pioches ? Ce ne sont pas les nôtres. Mes mineurs creusent, mais pour quelqu’un d’autre.',
        'Ils ont suivi le chant jusqu’au vieux village. Les gobelins les y attendaient. Ramène-les-moi, et fais taire leur contremaître.'
      ],
      active: 'Grik compte ses prisonniers toutes les heures. Il ne sait compter que jusqu’à quatre.',
      ready:
        'Ils sont tous là ! Et ils disent que c’est la paroi qui chantait, au fond : trois notes lourdes, comme un cœur. La première voix, c’est l’argile elle-même.',
      after: 'Les mineurs sifflent le chant en travaillant, maintenant. Ça creuse plus droit.'
    },
    memory:
      'La voix de l’argile : « Je porte. Je porte l’île, et les racines, et vos maisons. Personne ne me l’a jamais demandé. Personne ne m’a jamais remerciée. »'
  },
  {
    id: 33,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'La voix du fer',
    npc: 'disa',
    site: 'q33',
    requires: 31,
    level: 1,
    summary:
      'À Khaz-Ombral, les sentinelles de pierre montent toujours la garde. Dísa veut savoir ce qu’elles gardent, et contre qui.',
    steps: [
      {
        k: 'loot',
        n: 5,
        mobs: ['Squelette nain', 'Spectre minier'],
        icon: '🔷',
        item: 'Rune royale',
        text: 'Reprendre les runes royales aux morts de la cité'
      },
      {
        k: 'pick',
        n: 3,
        spread: [4, 8],
        art: 'voice',
        keep: true,
        icon: '🔷',
        item: 'Pilier runique éveillé',
        label: 'Poser la rune',
        ambush: ['Sentinelle de pierre', 1],
        text: 'Éveiller les trois piliers runiques'
      },
      {
        k: 'hunt',
        mob: 'Sentinelle de pierre',
        title: 'Le Veilleur aveugle',
        at: [0, 0],
        icon: '👁️',
        label: 'Défier le Veilleur',
        text: 'Vaincre le Veilleur aveugle, capitaine des sentinelles'
      }
    ],
    reward: { flags: ['voice2'], item: 'Rare', text: 'La voix du fer et un équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Regarde-les marcher. Toujours le même tour, depuis mille ans. Une patrouille protège quelque chose, ou empêche quelque chose de sortir.',
        'Les runes royales leur parlaient, autrefois. Les morts les portent encore. Rends-les aux piliers, et demande au capitaine ce qu’il garde.'
      ],
      active:
        'Ne frappe pas les statues qui ne bougent pas. Les autres non plus, si tu peux éviter. Mais tu ne pourras pas.',
      ready:
        'Le Veilleur a parlé en tombant ? « La porte était fermée de l’intérieur. » Alors ceux de Khaz-Ombral n’ont pas fui… Ils se sont enfermés. Avec quoi ?',
      after: 'Les sentinelles s’arrêtent quand je passe. L’une d’elles a hoché la tête, je crois.'
    },
    memory:
      'La voix du fer : « L’Ombre est venue de la mer et elle a cherché un chemin par en bas. Le roi Ombral a fermé la cité sur elle, et sur les siens. Ils l’ont tenue avec leurs mains. Là-haut, on ne l’a jamais su. »'
  },
  {
    id: 34,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'La voix des oubliés',
    npc: 'oin',
    site: 'q34',
    requires: 31,
    level: 1,
    summary:
      'Dans la Nécropole, les tombes n’ont plus de noms : ils ont été grattés, un par un. Les âmes tournent en rond, incapables de se reposer.',
    steps: [
      {
        k: 'pick',
        n: 6,
        spread: [4, 10],
        art: 'grave',
        keep: true,
        icon: '🪦',
        item: 'Nom retrouvé',
        label: 'Lire la tombe du bout des doigts',
        text: 'Lire du bout des doigts les noms effacés'
      },
      {
        k: 'kill',
        n: 8,
        mobs: ['Goule', 'Corbeau des tombes'],
        what: 'Profanateur chassé',
        text: 'Chasser les goules et les corbeaux qui rongent les noms'
      },
      {
        k: 'wave',
        waves: [3, 4, 4],
        mobs: ['Goule', 'Chevalier des tombes', 'Âme errante'],
        what: 'la bougie des noms',
        icon: '🕯️',
        art: 'candle',
        at: [0, 0],
        label: 'Allumer la bougie des noms',
        text: 'Veiller la bougie pendant qu’Óin dit les noms'
      }
    ],
    reward: {
      flags: ['voice3'],
      item: 'Rare',
      text: 'La voix des oubliés et un équipement Rare de ton niveau'
    },
    talk: {
      offer: [
        'Quelqu’un a gratté les noms. Tous. À la main, avec les ongles. Ça a dû prendre des siècles.',
        'Un mort sans nom ne dort pas. Retrouve-m’en six, du bout des doigts, et chasse ce qui les ronge. Ensuite on allumera une bougie, et je les dirai à voix haute. Ça va attirer du monde.'
      ],
      active: 'Ferme les yeux pour lire. Sur une tombe grattée, les doigts voient mieux.',
      ready:
        'Je les ai tous dits, et la bougie ne s’est pas éteinte. Tu as entendu, à la fin ? Elles ont répondu. Pas des plaintes : elles chantaient leur nom.',
      after: 'J’en dis dix chaque soir. Il m’en reste pour deux cents ans. J’ai de la bougie.'
    },
    memory:
      'La voix des oubliés : « Nous avons tenu la porte. Quand nos bras sont tombés, nos noms l’ont tenue. Quand on a effacé nos noms, le chagrin l’a tenue à notre place. Et le chagrin a pris une forme. »'
  },
  {
    id: 35,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'La voix de la mousse',
    npc: 'thyra',
    site: 'q35',
    requires: 31,
    level: 1,
    summary:
      'À Fangeval, les champignons dansent. Thyra a suivi l’un d’eux, tout petit, qui veut rejoindre le Grand Cercle et que tout le marais essaie de manger.',
    steps: [
      {
        k: 'kill',
        n: 8,
        mobs: ['Mille-pattes géant', 'Moustique des fanges'],
        what: 'Dévoreur vaincu',
        text: 'Éclaircir les mille-pattes et les moustiques des fanges'
      },
      {
        k: 'pick',
        n: 5,
        spread: [4, 10],
        art: 'shroom',
        icon: '🍄',
        item: 'Spore luisante',
        label: 'Cueillir la spore',
        text: 'Cueillir des spores luisantes pour éclairer la route'
      },
      {
        k: 'escort',
        art: 'mob',
        mob: 'Myconide',
        scale: 0.6,
        who: 'Mousseron',
        from: [0, 2],
        to: [0, -9],
        ambush: [
          ['Moustique des fanges', 3],
          ['Mille-pattes géant', 2],
          ['Limace des fanges', 3]
        ],
        label: 'Accompagner Mousseron',
        text: 'Escorter Mousseron jusqu’au Grand Cercle'
      }
    ],
    reward: {
      flags: ['voice4'],
      item: 'Rare',
      text: 'La voix de la mousse et un équipement Rare de ton niveau'
    },
    talk: {
      offer: [
        'Regarde, là, derrière ma botte. Il s’appelle Mousseron. Il a trois jours. Il veut aller danser.',
        'Le Grand Cercle est au bout de la caverne. Pour lui, c’est le bout du monde. Nettoie le chemin, éclaire-le, et marche à son pas. Il a de toutes petites jambes.'
      ],
      active: 'S’il s’arrête, c’est qu’il t’attend. Ou qu’il a vu un joli caillou.',
      ready:
        'Il danse ! Ils dansent tous, et le sol chante sous eux… C’est ça, la quatrième voix. La seule qui n’a jamais cessé d’être heureuse.',
      after: 'Mousseron a grandi d’un doigt. Il me fait signe de loin, maintenant. Comme un grand.'
    },
    memory:
      'La voix de la mousse : « Rien ne finit. On pourrit un peu, on repousse beaucoup. Dis-le à celui qui pleure au fond de la faille : il n’a pas besoin de tenir la porte tout seul. »'
  },
  {
    id: 36,
    chapter: INTERLUDE,
    main: true,
    scaled: true,
    title: 'Le chœur des profondeurs',
    npc: 'brunhild',
    site: 'q36',
    requires: [32, 33, 34, 35],
    level: 1,
    summary:
      'Quatre voix, et une cinquième qui pleure au fond de la faille, sous la Nécropole. Brunhild veut y descendre elle-même. Elle a quelque chose à lui chanter.',
    steps: [
      {
        k: 'escort',
        art: 'dwarf',
        dwarf: {
          beard: '#e8e8e0',
          helm: '#5a3a5a',
          tunic: '#3a2e3a',
          tool: 'staff',
          fem: true,
          skin: '#e8b48a'
        },
        who: 'Ancienne Brunhild',
        from: [0, 9],
        to: [0, 1],
        ambush: [
          ['Âme errante', 2],
          ['Chevalier des tombes', 2]
        ],
        label: 'Donner le bras à Brunhild',
        text: 'Accompagner Brunhild au bord de la faille'
      },
      {
        k: 'wave',
        waves: [3, 4, 5],
        mobs: ['Spectre minier', 'Squelette nain', 'Âme errante', 'Gargouille'],
        what: 'le chant de Brunhild',
        icon: '🎵',
        art: 'voice',
        at: [0, 0],
        label: 'Commencer le chant',
        text: 'Protéger Brunhild pendant qu’elle appelle les quatre voix'
      },
      { k: 'guardian', text: 'Vaincre Karn-Duram, l’écho du deuil (E sur le sceau)' },
      { k: 'choice', text: 'Choisir le nom à graver sur le vingt-et-unième pilier' }
    ],
    reward: {
      item: 'Légendaire',
      flags: ['echo'],
      text: 'Équipement Légendaire de ton niveau, Écho (une lueur d’ambre qui t’accompagne) et le dernier couplet de la Ballade'
    },
    talk: {
      offer: [
        'Tu as les quatre voix. Alors tu sais qui pleure. Le chagrin de Khaz-Ombral a tenu la porte si longtemps qu’il a oublié qu’il pouvait la lâcher.',
        'Mon aïeule était de là-bas. Je vais lui chanter la fin, et tu me donneras le bras jusqu’à la faille. Ne discute pas. J’ai deux cent quarante ans, je fais ce que je veux.'
      ],
      active: 'La faille est au fond de la Nécropole. Je t’y attends, je marche plus vite qu’on ne croit.',
      ask: 'Il s’est endormi. Enfin. Il reste un pilier sans nom dans la salle du roi, le vingt-et-unième. Thrain le gardait pour lui. Il m’a dit ce matin : « Que le voyageur choisisse. »',
      ready:
        'C’est gravé. Écoute… la pierre ne chante plus. Elle fredonne. Et quelqu’un là-haut, au bord de la mer, vient de lever la tête.',
      after: 'Je dors bien, maintenant. À mon âge, c’est un trésor plus rare que le mithril.',
      afterChoice: [
        'Sur le pilier, Thrain a gravé tous les noms qu’Óin retrouve. Il a fallu réduire la taille des lettres.',
        'Sur le pilier, il y a écrit « Ombral ». Dessous, une main d’enfant a ajouté « merci ». Fili jure que ce n’est pas lui.'
      ]
    },
    choices: ['Les noms de tous les oubliés', 'Celui du roi Ombral, qui a fermé la porte'],
    verse:
      'Et sous nos pas, très bas, la pierre tient la note que le ciel a perdue et que la nuit nous porte.',
    memory:
      'Le chœur des profondeurs : l’Ombre avait deux chemins vers le Cœur. Là-haut, on a brisé la lumière pour la sauver. En bas, un roi a fermé sa cité. Les deux sacrifices se sont ignorés pendant mille ans. Maintenant, ils chantent la même chanson.'
  },
  // ---------------------------------------------------------------- Quêtes secondaires
  {
    id: 37,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'La lanterne de Gloin',
    npc: 'gloin',
    site: 'q37',
    level: 1,
    summary:
      'Gloin veut offrir à sa femme la plus belle lanterne de Durgrim. Il lui manque du minerai, des carapaces brillantes, et du courage.',
    steps: [
      { k: 'work', job: 'ore', n: 5, text: 'Extraire cinq minerais, en bas ou à la surface' },
      {
        k: 'loot',
        n: 4,
        mobs: ['Scarabée foreur'],
        icon: '🪲',
        item: 'Carapace brillante',
        text: 'Prendre des carapaces aux scarabées foreurs'
      }
    ],
    reward: { item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Dis… Ylva dit toujours : « Mon mari rentre quand la lanterne s’éteint. » J’aimerais qu’un soir, elle ne s’éteigne pas. Que je rentre avant.',
        'Alors je fabrique une lanterne si belle que le contremaître me laissera partir juste pour la voir allumée. Du minerai, des carapaces. Tu m’aides ?'
      ],
      active:
        'Les scarabées foreurs des Galeries ont les plus belles carapaces. On dirait du ciel, paraît-il.',
      ready:
        'Elle est… oh. Elle est magnifique. Tu crois qu’elle va pleurer ? Moi, je pleure déjà. Tiens, prends ça.',
      after: 'Je suis rentré à l’heure. Elle a cru que j’étais malade.'
    }
  },
  {
    id: 38,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'Un morceau de ciel',
    npc: 'fili',
    site: 'q38',
    level: 1,
    summary: 'Petit Fili n’a jamais vu le ciel. Il voudrait que tu lui en rapportes un morceau. Pas un gros.',
    steps: [
      { k: 'sky', text: 'Remonter à la surface et remplir la fiole de ciel' },
      { k: 'work', job: 'herb', n: 2, text: 'Cueillir deux herbes qui sentent le soleil' }
    ],
    reward: { item: 'Peu commun', text: 'Équipement Peu commun de ton niveau et le secret de Fili' },
    talk: {
      offer: [
        'Tu viens de là-haut, hein ? Papa dit que le plafond est bleu et qu’il n’y a rien pour le tenir. Il tombe jamais ?',
        'J’ai vidé cette fiole exprès. Tu peux la remplir de ciel ? Et me rapporter quelque chose qui sent dehors. Je donne mon plus beau caillou !'
      ],
      active: 'N’oublie pas de bien refermer le bouchon. Le ciel, ça doit s’échapper.',
      ready:
        'Elle est vide ! … Non. Attends. Elle est pleine de bleu très clair. Je la mettrai près de mon lit. Tiens, mon caillou. Il est tombé d’en haut, une nuit, il y a trois semaines. Il chantait.',
      after: 'La nuit, je débouche un tout petit peu la fiole. Ça sent l’herbe.'
    },
    memory:
      'Le caillou de Fili : un éclat de la même étoile que Lumi. Elle n’est pas tombée à côté du Camp par hasard : une moitié est allée vers l’île, l’autre vers ce qu’il y a dessous.'
  },
  {
    id: 39,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'Les pioches de la Mine Effondrée',
    npc: 'balin',
    site: 'q39',
    level: 1,
    summary: 'Le frère de Balin est mort dans la Mine Effondrée. Quelque chose y tient encore sa pioche.',
    steps: [
      {
        k: 'kill',
        n: 6,
        mobs: ['Taupe-garou', 'Ver des boues'],
        what: 'Bête des Galeries vaincue',
        text: 'Dégager la route de la mine : taupes-garous et vers des boues'
      },
      { k: 'clear', instance: 10, text: 'Terminer la Mine Effondrée de Durgrim' }
    ],
    reward: { item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Mon frère Frerin descendait tous les matins à la Mine Effondrée. Elle ne s’appelait pas comme ça, à l’époque.',
        'Grumbar hante encore les galeries avec les outils des nôtres. Je garde cette porte depuis vingt ans pour ne pas avoir à y aller. Vas-y à ma place.'
      ],
      active: 'La mine est au bout de la route des Galeries, à l’ouest. Entre à plusieurs si tu peux.',
      ready:
        'Sa pioche… Il y avait gravé nos deux noms. Je croyais l’avoir rêvé. Prends mon arme de parade, je n’en ai plus besoin.',
      after: 'J’ai demandé un tour de garde de moins par semaine. Pour aller lui porter de la bière.'
    }
  },
  {
    id: 40,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'La bière qui voit double',
    npc: 'dorn',
    site: 'q40',
    level: 1,
    summary:
      'Dorn le Tavernier a perdu un pari contre Helga : il doit servir une bière de champignon que même Dwalin trouvera forte.',
    steps: [
      {
        k: 'loot',
        n: 5,
        mobs: ['Myconide'],
        icon: '🍄',
        item: 'Chapeau de myconide',
        text: 'Récolter des chapeaux de myconide'
      },
      {
        k: 'loot',
        n: 3,
        mobs: ['Limace des fanges'],
        icon: '🧪',
        item: 'Bave pétillante',
        text: 'Récolter de la bave de limace, pour les bulles'
      },
      {
        k: 'talk',
        npc: 'dwalin',
        lines: [
          'De la part de Dorn ? Sa bière, on dirait de l’eau de vaisselle. Donne. … … …',
          'Pourquoi êtes-vous deux ? Non. Trois. Dis à Dorn… dis aux Dorn… qu’ils ont gagné. Et aide-moi à tenir ce mur, il tangue.'
        ],
        text: 'Faire goûter la bière au Garde Dwalin'
      }
    ],
    reward: { item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Helga prétend que ma bière est « tendre ». TENDRE ! J’ai parié ma taverne que je ferais tomber Dwalin en une chope.',
        'Il me faut des chapeaux de myconide bien mûrs, et de la bave de limace pour les bulles. Ne fais pas cette tête, on en met dans tout.'
      ],
      active: 'Fangeval, au sud de la forteresse. Ça sent déjà ma bière, tu ne peux pas te tromper.',
      ready: 'Il a dit « les Dorn » ? Au pluriel ? HELGA ! VIENS PAR ICI ! Tiens, l’ami, ta part du pari.',
      after: 'On l’a appelée la Voit-Double. Dwalin en commande une par semaine, assis.'
    }
  },
  {
    id: 41,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'Le colporteur égaré',
    npc: 'perrin',
    site: 'q41',
    level: 1,
    summary:
      'Perrin vendait des rubans à la surface. Il s’est assis sur une trappe pour manger un sandwich. Depuis, il vend des rubans à personne.',
    steps: [
      {
        k: 'pick',
        n: 5,
        spread: [4, 9],
        icon: '🎀',
        item: 'Rouleau de rubans',
        label: 'Ramasser les rubans',
        text: 'Retrouver sa marchandise éparpillée'
      },
      {
        k: 'loot',
        n: 1,
        chance: 0.35,
        mobs: ['Taupe-garou', 'Ver des boues', 'Gobelin des mines'],
        icon: '🥪',
        item: 'Sandwich à peine mordu',
        text: 'Reprendre le sandwich de Perrin'
      },
      {
        k: 'escort',
        art: 'person',
        look: { sex: 'm', race: 'humain', hair: '#c88a3a', outfit: 'rose' },
        who: 'Perrin',
        from: [0, 1],
        to: [0, 12],
        ambush: [
          ['Gobelin des mines', 2],
          ['Taupe-garou', 2]
        ],
        label: 'Accompagner Perrin',
        text: 'Escorter Perrin vers la route de Durgrim'
      }
    ],
    reward: { item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Un visage ! Un visage sans barbe ! Pardon. Je me présente : Perrin, rubans, dentelles, articles de mode. Je suis tombé.',
        'Tout est tombé avec moi, jusqu’à mon sandwich, et une bête me l’a pris. Si tu retrouves tout ça et que tu m’emmènes jusqu’à une route… je te fais un prix.'
      ],
      active: 'Les rubans jaunes sont les plus chers. Le sandwich, c’est sentimental.',
      ready:
        'Une route ! Des gens ! Petits, mais des gens ! Tiens, prends ceci, c’était dans le lot invendu.',
      after: 'Les naines adorent mes rubans pour leurs tresses. Je crois que je vais rester un peu.'
    }
  },
  {
    id: 42,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'La cloche engloutie',
    npc: 'orsik',
    site: 'q42',
    level: 1,
    summary:
      'Orsik sonnait la cloche de Khaz-Ombral. Le dernier soir, il n’a pas eu le temps. Mille ans plus tard, ça le tracasse encore.',
    steps: [
      {
        k: 'pick',
        n: 5,
        spread: [4, 9],
        icon: '🔔',
        item: 'Éclat de bronze',
        label: 'Ramasser le bronze',
        ambush: ['Squelette nain', 1],
        text: 'Retrouver les éclats de la cloche'
      },
      {
        k: 'wave',
        waves: [3, 4],
        mobs: ['Gargouille', 'Spectre minier'],
        what: 'la cloche',
        icon: '🔔',
        art: 'bell',
        at: [0, 0],
        label: 'Sonner la cloche',
        text: 'Défendre la cloche pendant qu’elle sonne'
      },
      { k: 'clear', instance: 11, text: 'Terminer les Halls Engloutis de Khaz-Ombral' }
    ],
    reward: { item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Le soir de la Grande Fermeture, j’avais la corde en main. Le roi a dit : « Pas un bruit. » Alors je n’ai pas sonné.',
        'Personne n’a su que c’était la fin. On dit au revoir, d’habitude. Aide-moi à la sonner une fois, et va dire au roi Ombral que son sonneur a fini son service.'
      ],
      active: 'Les gargouilles détestent les cloches. C’est une vieille histoire de pigeons.',
      ready:
        'Tu l’as entendue ? Elle était un peu fausse. Elle l’a toujours été. Merci. J’ai fini mon service.',
      after: 'Dong… Pardon. L’habitude.'
    }
  },
  {
    id: 43,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'Les clés de la Crypte',
    npc: 'runa',
    site: 'q43',
    level: 1,
    summary:
      'Sœur Runa a juré de refermer la Crypte des Mille Tombes. Pour l’instant, elle en compte mille douze.',
    steps: [
      {
        k: 'loot',
        n: 4,
        mobs: ['Chevalier des tombes', 'Goule'],
        icon: '🗝️',
        item: 'Clé d’os',
        text: 'Reprendre les clés d’os aux chevaliers et aux goules'
      },
      { k: 'clear', instance: 12, text: 'Terminer la Crypte des Mille Tombes' },
      { k: 'choice', text: 'Choisir ce que Runa fera des clés' }
    ],
    reward: { item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Mille tombes, voilà ce que dit le registre. J’ai recompté : mille douze. Le Fossoyeur Éternel creuse plus vite que je n’écris.',
        'Les chevaliers portent les clés de la crypte. Reprends-les, descends, et arrête ce zélé. On ne creuse pas la tombe des gens avant qu’ils soient morts. C’est une question de politesse.'
      ],
      active: 'Si tu vois une tombe à ton nom, ne t’allonge pas dedans pour vérifier la taille.',
      ask: 'C’est fini. Voilà les quatre clés. Dis-moi, toi qui en reviens : on ferme la crypte pour de bon, ou on laisse une porte aux familles ?',
      ready:
        'Ce sera fait comme tu l’as dit. Prends ceci dans le tronc des offrandes, les morts n’en ont pas l’usage.',
      after: 'Le registre dit mille, et j’en compte mille. Je dors mieux.',
      afterChoice: [
        'La crypte est fermée. J’ai jeté les clés dans le lac. Elles ont fait un joli bruit.',
        'Les familles viennent le soir, avec des bougies. Ce n’est plus une crypte. C’est presque un salon.'
      ]
    },
    choices: ['Ferme-la pour toujours', 'Laisse une porte aux familles']
  },
  {
    id: 44,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'La reine qui ne dansait plus',
    npc: 'girolle',
    site: 'q44',
    level: 1,
    summary:
      'Girolle est une myconide, et elle est polie. Sa reine, au fond des Tréfonds Fongiques, ne l’est plus du tout.',
    steps: [
      {
        k: 'kill',
        n: 8,
        mobs: ['Limace des fanges', 'Mille-pattes géant'],
        what: 'Parasite vaincu',
        text: 'Chasser les limaces et les mille-pattes qui rongent la colonie'
      },
      {
        k: 'pick',
        n: 4,
        spread: [4, 8],
        art: 'nest',
        icon: '🥚',
        item: 'Ponte détruite',
        label: 'Écraser la ponte',
        ambush: ['Limace des fanges', 2],
        text: 'Détruire les pontes de limaces'
      },
      { k: 'clear', instance: 13, text: 'Terminer les Tréfonds Fongiques' }
    ],
    reward: { item: 'Épique', text: 'Équipement Épique de ton niveau' },
    talk: {
      offer: [
        'Bonjour-bonjour. Toi pas-mousse, mais toi gentil-pas. Girolle parler bien la langue des pieds, oui ?',
        'La reine danse plus. La reine mange ceux qui dansent. Limaces ont pondu dans ses rêves. Toi nettoyer dehors, puis nettoyer dedans. Doucement-fort.'
      ],
      active: 'Pontes rondes, pontes gluantes. Écraser avec le talon, pas avec la pointe. Pointe glisse.',
      ready:
        'La reine est dé-réveillée ! Nouvelle reine petite-petite pousse déjà. Elle danse mal. C’est très beau. Cadeau !',
      after: 'Girolle apprend la valse des pieds. Un-deux-trois-mousse, un-deux-trois-mousse.'
    }
  },
  {
    id: 45,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'Le dentier du grand-père',
    npc: 'nog',
    site: 'q45',
    level: 1,
    summary: 'Une taupe a volé le dentier en or de Grand-père Nog. Elle s’en sert, et c’est ça le pire.',
    steps: [
      {
        k: 'chase',
        n: 1,
        art: 'mole',
        who: 'La taupe au dentier',
        label: 'Attraper la taupe',
        text: 'Rattraper la taupe au sourire doré'
      },
      {
        k: 'loot',
        n: 4,
        mobs: ['Ver des boues'],
        icon: '🪱',
        item: 'Asticot de qualité',
        text: 'Trouver des asticots pour consoler la taupe'
      }
    ],
    reward: { item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Fa m’a folé mon dentier ! La taupe ! Elle me regarde, elle fourit, et elle f’en fa ! AFec MES dents !',
        'Rattrape-la. Et fois gentil aFec, elle est Fieille auffi. Trouve-lui de quoi manger mou.'
      ],
      active: 'Elle creufe Fite mais elle court comme moi. F’est dire.',
      ready:
        'Clac. Ah. Beaucoup mieux. Elle les a nettoyées, la brave bête. Elles n’ont jamais autant brillé. Tiens, pour toi.',
      after: 'On déjeune ensemble le dimanche, elle et moi. Elle mange plus proprement.'
    }
  },
  {
    id: 46,
    chapter: INTERLUDE,
    main: false,
    scaled: true,
    title: 'La course des spores',
    npc: 'bolet',
    site: 'q46',
    level: 1,
    summary:
      'Bolet organise la grande course des spores. Il est le seul inscrit depuis quarante ans, et il finit toujours deuxième.',
    steps: [
      { k: 'race', n: 7, spread: [4, 9], text: 'Courir la course des spores avant qu’elles retombent' },
      {
        k: 'chase',
        n: 3,
        art: 'firefly',
        who: 'Spore fugueuse',
        label: 'Attraper la spore',
        text: 'Rattraper trois spores fugueuses'
      },
      { k: 'race', n: 8, spread: [5, 10], text: 'Courir la revanche, plus longue et plus rapide' }
    ],
    reward: { item: 'Rare', text: 'Équipement Rare de ton niveau' },
    talk: {
      offer: [
        'Toi ! Toi courir ! Bolet gagner course chaque année, sauf que le vent gagne avant. Le vent triche.',
        'Suis les fanions. Les spores retombent vite : si elles touchent le sol, perdu. Après, revanche. Toujours revanche.'
      ],
      active: 'Les jambes, c’est comme les racines mais ça va moins profond et plus loin.',
      ready:
        'Premier ! Bolet encore deuxième ! Mais deuxième derrière un pas-mousse, c’est une première. Cadeau !',
      after: 'L’an prochain, Bolet invite la reine. Elle finira troisième. Enfin un podium.'
    }
  }
]);
