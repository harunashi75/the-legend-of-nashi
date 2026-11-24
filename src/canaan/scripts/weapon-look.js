// Armes tenues en main : chaque héros porte l'arme de sa classe (bâton sylvestre, masse et égide, dagues jumelles,
// bâton élémentaire, luth, arc long, épées jumelles, Grimoire, Grande hache), dessinée en pixels et tournée vers sa
// mire, avec une animation d'attaque propre à chacune : taille en arc (masse), double taille (épées jumelles), estocs
// (dagues), tir (arc : corde tirée puis relâchée), égide levée au bras (Paladin), poussée et éclat (bâtons), cordes
// pincées (luth), livre ouvert vers la mire (Grimoire), grand coup à deux mains (Grande hache). Le Druide en forme
// féline n'a pas d'arme : la panthère bondit et griffe (lunge, clawSwipe).
// Le héros se tourne vers sa mire à l'arrêt et pendant une attaque. Rien n'est sauvegardé ni simulé ici.
(() => {
  'use strict';
  const SCALE = 2;
  // Couleur de la traînée d'une attaque (comme les effets des compétences).
  const TRAIL = {
    wildstaff: '#9be36a',
    aegis: '#ffe4a2',
    sword: '#c9f1ff',
    dualsword: '#b2d8ff',
    axe: '#ffb078',
    mace: '#e7c08c',
    spear: '#9ce6d5',
    dualdagger: '#e5a7ff',
    bow: '#a7e8a0',
    staff: '#ff9a4a',
    shield: '#ffe4a2',
    lute: '#ff9ad5',
    grimoire: '#a4e83c',
    greataxe: '#e0404f'
  };
  // ---------------------------------------------------------------- Sprites (pointe vers +x, poignée au point pivot)
  // Chaque dessin renvoie {w, h, px, py, draw(R)} : taille en pixels du sprite, pivot (main), et ses rectangles.
  const ST = '#d9e3ea',
    STL = '#ffffff',
    STD = '#7e8c99',
    GO = '#e2b85a',
    GOD = '#9a7430',
    WO = '#8a5a34',
    WOD = '#5a3820',
    LE = '#4a2e22';
  const ART = {
    sword: {
      w: 26,
      h: 9,
      px: 3,
      py: 4,
      draw(R) {
        R(0, 3, 4, 3, LE);
        R(0, 4, 4, 1, '#6a4434');
        R(-1, 3, 1, 3, GO);
        R(4, 0, 2, 9, GO);
        R(4, 0, 1, 9, GOD);
        R(6, 3, 16, 3, ST);
        R(6, 3, 16, 1, STL);
        R(6, 5, 16, 1, STD);
        R(22, 3, 2, 3, ST);
        R(24, 4, 2, 1, STL);
      }
    },
    dagger: {
      w: 16,
      h: 7,
      px: 2,
      py: 3,
      draw(R) {
        R(0, 2, 3, 3, LE);
        R(3, 0, 2, 7, GO);
        R(5, 2, 8, 3, ST);
        R(5, 2, 8, 1, STL);
        R(5, 4, 8, 1, STD);
        R(13, 3, 2, 1, STL);
      }
    },
    axe: {
      w: 25,
      h: 14,
      px: 2,
      py: 9,
      draw(R) {
        R(0, 8, 22, 2, WO);
        R(0, 9, 22, 1, WOD);
        R(5, 8, 1, 2, LE);
        R(9, 8, 1, 2, LE);
        // Tête : lame évasée au-dessus du manche, tranchant clair, petit talon dessous.
        R(16, 4, 5, 4, STD);
        R(15, 2, 7, 2, ST);
        R(13, 0, 11, 2, ST);
        R(13, 0, 11, 1, STL);
        R(14, 2, 1, 1, ST);
        R(22, 2, 1, 1, ST);
        R(17, 4, 3, 3, ST);
        R(17, 10, 3, 2, STD);
        R(16, 7, 5, 1, GOD);
      }
    },
    // Grande hache (Berserker) : long manche gainé de cuir rouge, double tranchant d'acier sombre taché de sang.
    greataxe: {
      w: 34,
      h: 18,
      px: 3,
      py: 9,
      draw(R) {
        R(-1, 7, 2, 4, GO);
        R(0, 8, 28, 2, '#4a2e22');
        R(0, 9, 28, 1, '#2e1c14');
        R(3, 7, 1, 4, '#8a1a24');
        R(6, 7, 1, 4, '#8a1a24');
        R(9, 7, 1, 4, '#8a1a24');
        // Lame du haut.
        R(23, 6, 7, 2, STD);
        R(21, 2, 11, 4, ST);
        R(20, 0, 13, 2, ST);
        R(20, 0, 13, 1, '#f6d2d6');
        R(21, 5, 11, 1, STD);
        // Lame du bas.
        R(23, 10, 7, 2, STD);
        R(21, 12, 11, 4, ST);
        R(20, 16, 13, 2, ST);
        R(20, 17, 13, 1, STD);
        R(21, 12, 11, 1, STL);
        // Douille, rivet et pointe.
        R(24, 7, 6, 4, '#3a3a46');
        R(26, 8, 2, 2, GO);
        R(30, 8, 4, 2, ST);
        // Sang.
        R(21, 3, 2, 2, '#c0202e');
        R(22, 1, 1, 1, '#c0202e');
        R(28, 13, 3, 2, '#c0202e');
        R(29, 16, 2, 1, '#8a1020');
      }
    },
    mace: {
      w: 24,
      h: 12,
      px: 2,
      py: 6,
      draw(R) {
        R(0, 5, 15, 2, WO);
        R(0, 6, 15, 1, WOD);
        R(2, 4, 3, 4, LE);
        R(15, 2, 7, 8, STD);
        R(16, 3, 5, 6, ST);
        R(16, 3, 2, 2, STL);
        R(17, 0, 3, 2, ST);
        R(17, 10, 3, 2, ST);
        R(22, 4, 2, 4, ST);
        R(13, 4, 2, 4, GO);
      }
    },
    spear: {
      w: 40,
      h: 9,
      px: 8,
      py: 4,
      draw(R) {
        R(0, 4, 32, 1, WO);
        R(0, 3, 32, 1, WOD);
        R(0, 5, 32, 1, WOD);
        R(30, 2, 2, 5, GO);
        R(32, 2, 5, 5, ST);
        R(37, 3, 2, 3, ST);
        R(39, 4, 1, 1, STL);
        R(32, 3, 6, 1, STL);
      }
    },
    staff: {
      w: 34,
      h: 12,
      px: 6,
      py: 6,
      draw(R) {
        R(0, 5, 26, 2, WO);
        R(0, 6, 26, 1, WOD);
        R(8, 4, 3, 4, LE);
        R(24, 3, 3, 6, GO);
        R(26, 1, 2, 3, GO);
        R(26, 8, 2, 3, GO);
        R(28, 3, 6, 6, '#ff7a2a');
        R(29, 4, 4, 4, '#ffd27a');
        R(29, 4, 2, 2, '#ffffff');
      }
    },
    // Bâton sylvestre du Druide : bois noueux, feuilles et cristal de sève au sommet.
    wildstaff: {
      w: 34,
      h: 14,
      px: 6,
      py: 7,
      draw(R) {
        R(0, 6, 25, 2, '#6a4a2a');
        R(0, 7, 25, 1, '#4a3018');
        R(6, 5, 2, 1, '#6a4a2a');
        R(12, 8, 2, 1, '#6a4a2a');
        R(18, 5, 2, 1, '#6a4a2a');
        R(9, 4, 3, 2, '#5fae3a');
        R(16, 8, 3, 2, '#7ee36a');
        R(23, 3, 3, 8, '#6a4a2a');
        R(25, 1, 2, 3, '#6a4a2a');
        R(25, 10, 2, 3, '#6a4a2a');
        R(27, 4, 6, 6, '#58c84a');
        R(28, 5, 4, 4, '#b8ff8a');
        R(28, 5, 2, 2, '#ffffff');
        R(26, 0, 3, 2, '#7ee36a');
        R(26, 12, 3, 2, '#7ee36a');
      }
    },
    // Luth : caisse en poire au pivot (rosace, chevalet), manche à frettes vers +x, chevillier coudé, ruban rose.
    lute: {
      w: 26,
      h: 12,
      px: 5,
      py: 6,
      draw(R) {
        R(1, 1, 8, 10, '#c08048');
        R(0, 2, 10, 8, '#c08048');
        R(0, 7, 10, 3, WO);
        R(1, 10, 8, 1, WO);
        R(2, 2, 3, 1, '#e0a868');
        R(4, 4, 3, 3, '#3a2414');
        R(5, 5, 1, 1, GO);
        R(1, 5, 1, 2, WOD);
        R(10, 5, 12, 2, WOD);
        R(13, 5, 1, 2, GO);
        R(16, 5, 1, 2, GO);
        R(19, 5, 1, 2, GO);
        R(1, 6, 21, 1, '#efe6cf');
        R(22, 4, 4, 3, LE);
        R(23, 3, 1, 1, GO);
        R(25, 3, 1, 1, GO);
        R(23, 7, 1, 1, GO);
        R(25, 7, 1, 1, GO);
        R(8, 9, 2, 2, '#ff9ad5');
        R(9, 10, 1, 2, '#ff7ab8');
      }
    },
    // Arc : vertical (perpendiculaire à la visée), poignée au pivot ; la corde est dessinée à part (tension).
    bow: {
      w: 9,
      h: 34,
      px: 4,
      py: 17,
      draw(R) {
        R(2, 0, 2, 3, WOD);
        R(4, 2, 2, 5, WO);
        R(5, 6, 2, 8, WO);
        R(4, 14, 3, 6, LE);
        R(5, 20, 2, 8, WO);
        R(4, 27, 2, 5, WO);
        R(2, 31, 2, 3, WOD);
        R(5, 15, 2, 4, GO);
      }
    },
    // Outils des métiers (pointe vers +x, manche au pivot).
    // Pioche : long manche, tête de fer en croissant aux deux pointes recourbées vers le manche.
    pickaxe: {
      w: 22,
      h: 17,
      px: 2,
      py: 8,
      draw(R) {
        R(0, 7, 17, 2, WO);
        R(0, 8, 17, 1, WOD);
        R(3, 7, 1, 2, LE);
        // Douille au bout du manche, puis les deux bras du croissant.
        R(16, 5, 3, 7, STD);
        R(16, 5, 1, 7, ST);
        R(15, 3, 2, 2, ST);
        R(14, 2, 2, 1, ST);
        R(13, 1, 2, 1, ST);
        R(11, 0, 2, 1, STL);
        R(15, 12, 2, 2, ST);
        R(14, 14, 2, 1, ST);
        R(13, 15, 2, 1, ST);
        R(11, 16, 2, 1, STL);
        R(16, 3, 1, 2, STL);
        R(16, 12, 1, 2, STD);
      }
    },
    // Faucille : manche court, virole dorée et lame en croissant ouvert qui s'affine jusqu'à la pointe,
    // tranchant clair à l'intérieur.
    sickle: {
      w: 22,
      h: 16,
      px: 2,
      py: 12,
      draw(R) {
        R(0, 11, 7, 2, WO);
        R(0, 12, 7, 1, WOD);
        R(7, 11, 2, 2, GO);
        // Arc (centre 14,9, rayon 6) du bas vers le haut par la droite, sur 170° : épais au talon, fin à la pointe.
        for (let a = 100; a >= -70; a -= 10) {
          const t = (a * Math.PI) / 180,
            x = Math.round(14 + Math.cos(t) * 6),
            y = Math.round(9 + Math.sin(t) * 6),
            thick = a > 20 ? 2 : 1;
          R(x, y, thick, thick, ST);
          if (a < 90 && a > -60)
            R(Math.round(14 + Math.cos(t) * 4.8), Math.round(9 + Math.sin(t) * 4.8), 1, 1, STL);
        }
        R(9, 11, 3, 2, STD);
      }
    },
    // Pelle : long manche à poignée en D, douille de fer et lame en bêche à la pointe arrondie.
    shovel: {
      w: 25,
      h: 9,
      px: 3,
      py: 4,
      draw(R) {
        R(0, 1, 1, 7, WOD);
        R(0, 1, 3, 1, WOD);
        R(0, 7, 3, 1, WOD);
        R(2, 3, 14, 2, WO);
        R(2, 4, 14, 1, WOD);
        R(6, 3, 1, 2, LE);
        R(15, 2, 3, 5, STD);
        R(15, 2, 1, 5, ST);
        R(18, 0, 5, 9, STD);
        R(18, 1, 5, 7, ST);
        R(23, 1, 1, 7, ST);
        R(24, 2, 1, 5, ST);
        R(18, 1, 5, 1, STL);
        R(19, 2, 1, 5, STL);
      }
    },
    hammer: {
      w: 18,
      h: 12,
      px: 2,
      py: 6,
      draw(R) {
        R(0, 5, 12, 2, WO);
        R(0, 6, 12, 1, WOD);
        R(11, 1, 6, 10, STD);
        R(12, 2, 4, 8, ST);
        R(12, 2, 4, 1, STL);
      }
    },
    ladle: {
      w: 18,
      h: 9,
      px: 2,
      py: 4,
      draw(R) {
        R(0, 3, 12, 2, WO);
        R(0, 4, 12, 1, WOD);
        R(12, 1, 5, 6, STD);
        R(13, 2, 3, 4, ST);
        R(13, 2, 3, 1, STL);
      }
    },
    // Grimoire : livre relié de cuir sombre, vu de face, crâne d'os et fermoir doré (ne tourne pas).
    grimoire: {
      w: 12,
      h: 14,
      px: 6,
      py: 7,
      draw(R) {
        R(0, 0, 12, 14, '#2a1c36');
        R(1, 1, 10, 12, '#5a3f70');
        R(1, 1, 10, 1, '#7a5a94');
        R(11, 1, 1, 12, '#e8e0cc');
        R(1, 2, 10, 1, '#a4e83c');
        R(1, 11, 10, 1, '#a4e83c');
        R(4, 4, 4, 3, '#e9e3cf');
        R(5, 7, 2, 2, '#e9e3cf');
        R(4, 5, 1, 1, '#a4e83c');
        R(7, 5, 1, 1, '#a4e83c');
        R(11, 6, 1, 3, '#e2b85a');
      }
    },
    // Égide : bouclier vu de face, tenu devant soi (ne tourne pas).
    shield: {
      w: 16,
      h: 19,
      px: 8,
      py: 9,
      draw(R) {
        R(1, 0, 14, 2, GOD);
        R(0, 1, 16, 10, GOD);
        R(1, 11, 14, 3, GOD);
        R(3, 14, 10, 2, GOD);
        R(5, 16, 6, 2, GOD);
        R(7, 18, 2, 1, GOD);
        R(2, 2, 12, 9, '#3f63a8');
        R(3, 11, 10, 2, '#3f63a8');
        R(5, 13, 6, 2, '#3f63a8');
        R(7, 15, 2, 2, '#3f63a8');
        R(2, 2, 12, 2, '#5a82c8');
        R(7, 3, 2, 12, GO);
        R(4, 6, 8, 2, GO);
        R(7, 6, 2, 2, '#fff2b0');
      }
    }
  };
  const sprites = new Map();
  function sprite(kind) {
    if (sprites.has(kind)) return sprites.get(kind);
    const a = ART[kind],
      cv = document.createElement('canvas');
    cv.width = a.w + 2;
    cv.height = a.h + 2;
    const g = cv.getContext('2d');
    a.draw((x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x + 1, y + 1, w, h);
    });
    const out = typeof canaanOutline === 'function' ? canaanOutline(cv, 1) : cv;
    // Pivot dans le sprite détouré : +1 (marge du dessin) +1 (contour).
    const s = { img: out, px: a.px + 2, py: a.py + 2 };
    sprites.set(kind, s);
    return s;
  }
  // ---------------------------------------------------------------- Pose
  const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const clamp01 = k => Math.max(0, Math.min(1, k));
  // Avancement de l'attaque (0 au début, 1 à la fin ; -1 hors attaque). Le début est repéré quand atk remonte.
  function progress(body) {
    const atk = body.atk || 0;
    if (atk > (body._atkSeen || 0) + 0.05) body._atkPeak = atk;
    body._atkSeen = atk;
    return atk > 0 && body._atkPeak > 0 ? clamp01(1 - atk / body._atkPeak) : -1;
  }
  // Pièce posée : sprite, position de la main, rotation et miroir.
  function piece(c, kind, hx, hy, rot, flip = 1, alpha = 1) {
    const s = sprite(kind);
    c.save();
    c.globalAlpha *= alpha;
    c.translate(Math.round(hx), Math.round(hy));
    c.rotate(rot);
    c.scale(SCALE, SCALE * flip);
    c.imageSmoothingEnabled = false;
    c.drawImage(s.img, -s.px, -s.py);
    c.restore();
  }
  // Traînée d'une taille : croissant lumineux entre l'angle de départ et l'angle courant, autour de la main.
  function trail(c, hx, hy, r, a0, a1, color, fade) {
    if (fade <= 0 || Math.abs(a1 - a0) < 0.05) return;
    const ccw = a1 < a0;
    c.save();
    c.globalAlpha *= 0.55 * fade;
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 12;
    c.beginPath();
    c.arc(hx, hy, r, a0, a1, ccw);
    c.arc(hx, hy, r * 0.55, a1, a0, !ccw);
    c.closePath();
    c.fill();
    c.globalAlpha = Math.min(1, fade);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(hx, hy, r, a0 + (a1 - a0) * 0.35, a1, ccw);
    c.stroke();
    c.restore();
  }
  // Type d'arme et visée d'un héros : son équipement (ou ce que l'hôte en envoie), sa souris ou son intention.
  function weaponOf(hero) {
    return hero?.equipment?.weapon?.weaponType || hero?.netWeapon || '';
  }
  // Félin du Druide : bond en avant pendant une attaque (décalage du sprite vers la mire).
  function lunge(hero, body) {
    const k = progress(body);
    if (k < 0) return { dx: 0, dy: 0 };
    const a = aimOf(hero, body),
      d = Math.sin(clamp01(k * 1.6) * Math.PI) * 14;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.7 };
  }
  // Félin du Druide : trois griffes lumineuses qui lacèrent devant lui pendant l'attaque.
  function clawSwipe(c, hero, body, x, y) {
    const k = progress(body);
    if (k < 0 || k > 0.7) return;
    const a = aimOf(hero, body),
      e = ease(k / 0.5),
      fade = 1 - k / 0.7,
      cx = x + Math.cos(a) * 30,
      cy = y - 4 + Math.sin(a) * 20;
    c.save();
    c.translate(cx, cy);
    c.rotate(a + Math.PI / 2);
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (let s = -1; s <= 1; s++) {
      c.strokeStyle = 'rgba(200,245,154,' + (0.6 * fade).toFixed(3) + ')';
      c.lineWidth = 6 * fade + 1;
      c.beginPath();
      c.moveTo(-16 + s * 2, s * 8 - 12);
      c.quadraticCurveTo(0, s * 8 + 4, -16 + 32 * e + s * 2, s * 8 - 12 + 24 * e);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,' + fade.toFixed(3) + ')';
      c.lineWidth = 1.5;
      c.stroke();
    }
    c.restore();
  }
  function aimOf(hero, body) {
    // Pendant un travail (miner, cueillir, forger, cuisiner), le héros regarde ce qu'il travaille.
    const work = typeof CANAAN_GATHER === 'object' ? CANAAN_GATHER.workOf(hero || game.hero) : null;
    if (work) return Math.atan2(work.ty - body.y, work.tx - body.x);
    if (!hero || hero === game.hero) return typeof facingAngleCore === 'function' ? facingAngleCore() : 0;
    if (Number.isFinite(hero.netAim)) return hero.netAim;
    const i = hero.intent || {};
    if (
      Number.isFinite(i.aimX) &&
      Number.isFinite(i.aimY) &&
      Math.hypot(i.aimX - body.x, i.aimY - body.y) > 4
    )
      return Math.atan2(i.aimY - body.y, i.aimX - body.x);
    return (body.face || 1) === -1 ? Math.PI : 0;
  }
  // Direction du sprite (0 face, 1 droite, 2 dos, 3 gauche) d'après la visée.
  function faceFromAim(a) {
    const cx = Math.cos(a),
      cy = Math.sin(a);
    return Math.abs(cx) >= Math.abs(cy) * 0.9 ? (cx >= 0 ? 1 : 3) : cy < 0 ? 2 : 0;
  }
  // Dessin de l'arme d'un héros. layer : 'back' (derrière le corps) ou 'front'. Renvoie rien.
  // Particules d'un travail, au moment de chaque coup : éclats de roche, feuilles, étincelles, vapeur.
  const chips = {
    mine: ['#8a9098', '#c8ccd2'],
    herb: ['#5fcf5a', '#9ae08a'],
    forge: ['#ffd060', '#ff8a2a'],
    cook: ['#f4f8ff', '#dfe8f0'],
    dig: ['#7a5232', '#a87a4a'],
    leather: ['#8a5a32', '#c8945a']
  };
  function workParticles(kind, x, y) {
    const [a, b] = chips[kind];
    // Coup de pelle : la motte qui part, et son bruit.
    if (kind === 'dig' && typeof CANAAN_SOUND === 'object') CANAAN_SOUND.cue?.('dig');
    for (let k = 0; k < (kind === 'forge' || kind === 'dig' ? 7 : 4); k++)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (kind === 'cook' ? 0.8 : 4),
        vy: kind === 'cook' ? -1 - Math.random() : -1.5 - Math.random() * 2.5,
        life: 18 + Math.random() * 14,
        c: k % 2 ? a : b,
        r: kind === 'cook' ? 3 + Math.random() * 3 : 1.5 + Math.random() * 1.5
      });
  }
  // Animation d'un travail : l'outil du métier dans la main, des coups réguliers (un toutes les 0,6 s), une barre
  // d'avancement au-dessus du héros.
  const TOOL = {
    mine: 'pickaxe',
    herb: 'sickle',
    forge: 'hammer',
    cook: 'ladle',
    dig: 'shovel',
    leather: 'hammer'
  };
  function drawWork(c, body, x, y, layer, w) {
    const aim = Math.atan2(w.ty - body.y, w.tx - body.x),
      side = Math.cos(aim) >= 0 ? 1 : -1,
      hx = x + Math.cos(aim) * 11,
      hy = y + 4 + Math.sin(aim) * 6,
      beat = ((time / 60) % 0.6) / 0.6;
    if (layer === 'front') {
      let rot,
        px = hx,
        py = w.kind === 'herb' ? hy + 6 : hy;
      if (w.kind === 'cook') rot = aim + Math.sin(time * 0.25) * 0.5;
      // Pelle : enfoncer la lame dans la terre (la main descend vers le trou), puis lever la motte et la jeter.
      else if (w.kind === 'dig') {
        const push = beat < 0.45 ? beat / 0.45 : 1,
          lift = beat < 0.45 ? 0 : (beat - 0.45) / 0.55,
          down = push * (1 - lift);
        rot = aim + side * 0.9 * (1 - push) - side * 1.3 * Math.sin(lift * Math.PI);
        px += Math.cos(aim) * 5 * down;
        py += 3 * down;
      }
      // Faucille : des coups bas, de côté, au ras des herbes (jamais au-dessus de la tête).
      else if (w.kind === 'herb')
        rot = aim + Math.PI * 0.18 * side + side * Math.sin(beat * Math.PI * 2) * 0.55;
      else {
        // Lever puis abattre l'outil ; le coup tombe au tiers du battement.
        const swing = beat < 0.7 ? beat / 0.7 : 1 - (beat - 0.7) / 0.3;
        rot = aim - side * (1.6 - 1.9 * Math.pow(swing, 2.2));
      }
      piece(c, TOOL[w.kind], px, py, rot, side);
      // Un coup : une poignée de particules sur la cible (une fois par battement).
      // (La motte de la pelle part quand la lame remonte, aux deux tiers du battement.)
      const k = Math.floor((time + (w.kind === 'dig' ? 13 : 0)) / 36);
      if (body._workBeat !== k && (w.kind === 'cook' ? Math.random() < 0.6 : true)) {
        body._workBeat = k;
        workParticles(w.kind, w.tx, w.ty - (w.kind === 'herb' ? 6 : w.kind === 'dig' ? 2 : 14));
      }
      // Barre d'avancement.
      const bw = 44,
        by = y - 62;
      c.save();
      c.fillStyle = '#120c08cc';
      c.fillRect(x - bw / 2 - 2, by - 2, bw + 4, 9);
      c.fillStyle = {
        mine: '#c8ccd2',
        herb: '#7ee36a',
        forge: '#ff9a40',
        cook: '#ffd36d',
        dig: '#c8945a',
        leather: '#d8945a'
      }[w.kind];
      c.fillRect(x - bw / 2, by, bw * Math.min(1, w.p + 1 / (60 * 10)), 5);
      c.strokeStyle = '#f4d68d';
      c.lineWidth = 1;
      c.strokeRect(x - bw / 2 - 2.5, by - 2.5, bw + 5, 10);
      c.restore();
    }
  }
  function draw(c, hero, body, x, y, layer) {
    if (!body) return;
    if (body.form === 'feral') {
      if (layer === 'front') clawSwipe(c, hero, body, x, y);
      return;
    }
    const work = typeof CANAAN_GATHER === 'object' ? CANAAN_GATHER.workOf(hero) : null;
    if (work) return drawWork(c, body, x, y, layer, work);
    const type = weaponOf(hero),
      aim = aimOf(hero, body),
      k = progress(body),
      attacking = k >= 0,
      side = Math.cos(aim) >= 0 ? 1 : -1,
      up = Math.sin(aim) < -0.45,
      // Main principale : du côté visé, un peu plus haut quand on vise vers le haut.
      hx = x + Math.cos(aim) * 11 + (attacking ? 0 : side * 4),
      hy = y + 4 + Math.sin(aim) * 6,
      // Main secondaire : de l'autre côté du corps.
      ox = x - side * 12,
      oy = y + 6;
    const behind = up ? 'back' : 'front';
    const color = TRAIL[type] || '#ffffff';
    if (type === 'greataxe') {
      if (layer !== behind) return;
      const len = 32 * SCALE;
      if (attacking) {
        // Coup à deux mains : la hache part loin derrière l'épaule et s'abat devant la mire.
        const a0 = aim - side * 2.3,
          a1 = aim + side * 1.1,
          e = ease(k * 1.25),
          rot = a0 + (a1 - a0) * e;
        trail(c, hx, hy, len, a0, rot, color, 1 - k);
        piece(c, 'greataxe', hx, hy, rot, side);
      } else piece(c, 'greataxe', hx - side * 2, hy, -Math.PI / 2 + side * 0.3, side);
      return;
    }
    // Paladin : la masse dans la main, l'égide au bras de l'autre côté (levée pendant le coup).
    if (type === 'aegis') {
      const len = 22 * SCALE;
      if (layer === 'front' || (layer === 'back' && up)) {
        const sx = x - side * 10 + Math.cos(aim) * (attacking ? 6 : 2),
          sy = y + 6 + Math.sin(aim) * 4;
        if ((layer === 'front') !== up) piece(c, 'shield', sx, sy, attacking ? -side * 0.15 : 0, 1, 0.95);
      }
      if (layer !== behind) return;
      if (attacking) {
        const a0 = aim - side * 1.8,
          a1 = aim + side * 1.2,
          e = ease(k * 1.4),
          rot = a0 + (a1 - a0) * e;
        trail(c, hx, hy, len, a0, rot, color, 1 - k);
        piece(c, 'mace', hx, hy, rot, side);
      } else piece(c, 'mace', hx, hy, -Math.PI / 2 + side * 0.55, side);
      return;
    }
    if (type === 'sword' || type === 'axe' || type === 'mace') {
      if (layer !== behind) return;
      const len = (type === 'axe' ? 24 : type === 'mace' ? 22 : 24) * SCALE;
      if (attacking) {
        const a0 = aim - side * 1.7,
          a1 = aim + side * 1.25,
          e = ease(k * 1.4),
          rot = a0 + (a1 - a0) * e;
        trail(c, hx, hy, len, a0, rot, color, 1 - k);
        piece(c, type, hx, hy, rot, side);
      } else piece(c, type, hx, hy, -Math.PI / 2 + side * 0.55, side);
      return;
    }
    if (type === 'dualsword') {
      const len = 24 * SCALE;
      if (attacking) {
        // Deux tailles croisées : la main droite, puis la gauche en sens inverse.
        const k1 = clamp01(k * 1.8),
          k2 = clamp01((k - 0.3) * 1.8),
          a0 = aim - side * 1.5,
          a1 = aim + side * 1.2,
          r1 = a0 + (a1 - a0) * ease(k1),
          r2 = a1 + (a0 - a1) * ease(k2);
        if (layer === 'back') {
          if (k2 > 0) trail(c, x + Math.cos(aim) * 8, hy, len, a1, r2, color, 1 - k2);
          piece(c, 'sword', x + Math.cos(aim) * 8 - side * 4, hy + 2, k2 > 0 ? r2 : a1 + side * 0.4, -side);
        } else {
          trail(c, hx, hy, len, a0, r1, color, 1 - k1);
          piece(c, 'sword', hx, hy, r1, side);
        }
      } else if (layer === 'back') piece(c, 'sword', ox, oy, -Math.PI / 2 - side * 0.5, -side);
      else piece(c, 'sword', hx, hy, -Math.PI / 2 + side * 0.55, side);
      return;
    }
    if (type === 'dualdagger') {
      if (attacking) {
        // Deux estocs rapides, alternés.
        const s1 = Math.sin(clamp01(k * 2) * Math.PI) * 18,
          s2 = Math.sin(clamp01(k * 2 - 1) * Math.PI) * 18,
          ca = Math.cos(aim),
          sa = Math.sin(aim);
        if (layer === behind) piece(c, 'dagger', hx + ca * s1, hy + sa * s1 - 3, aim, side);
        else piece(c, 'dagger', x + ca * 6 + ca * s2 - side * 3, hy + 3 + sa * s2, aim + side * 0.2, side);
      } else if (layer === 'front') piece(c, 'dagger', hx, hy + 2, side > 0 ? 0.7 : Math.PI - 0.7, side);
      else piece(c, 'dagger', ox, oy, side > 0 ? Math.PI - 0.5 : 0.5, -side);
      return;
    }
    if (type === 'spear') {
      if (layer !== behind) return;
      if (attacking) {
        // Recul, puis estoc vers la mire.
        const d = k < 0.2 ? -8 * (k / 0.2) : -8 + 34 * Math.sin(((k - 0.2) / 0.8) * Math.PI),
          px = hx + Math.cos(aim) * d,
          py = hy + Math.sin(aim) * d;
        if (d > 10) {
          c.save();
          c.globalAlpha *= 0.5 * (1 - k);
          c.strokeStyle = color;
          c.lineWidth = 4;
          c.shadowColor = color;
          c.shadowBlur = 10;
          c.beginPath();
          c.moveTo(px + Math.cos(aim) * 40, py + Math.sin(aim) * 40);
          c.lineTo(px + Math.cos(aim) * (64 + d), py + Math.sin(aim) * (64 + d));
          c.stroke();
          c.restore();
        }
        piece(c, 'spear', px, py, aim, side);
      } else piece(c, 'spear', hx, hy, -Math.PI / 2 + side * 0.25, side);
      return;
    }
    if (type === 'staff' || type === 'wildstaff') {
      if (layer !== behind) return;
      const rot = attacking ? aim - side * 0.25 * (1 - ease(k)) : -Math.PI / 2 + side * 0.15,
        d = attacking ? Math.sin(k * Math.PI) * 10 : 0,
        px = hx + Math.cos(aim) * d,
        py = hy + Math.sin(aim) * d;
      piece(c, type, px, py, rot, side);
      // Orbe : lueur permanente (flamme du bâton élémentaire, sève du bâton sylvestre), éclat au lancer.
      const tipX = px + Math.cos(rot) * 28 * SCALE,
        tipY = py + Math.sin(rot) * 28 * SCALE,
        glow = attacking
          ? 10 + 14 * (1 - k)
          : 6 + Math.sin((typeof time === 'number' ? time : 0) * 0.08) * 1.5;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(tipX, tipY, 0, tipX, tipY, glow);
      g.addColorStop(0, type === 'wildstaff' ? 'rgba(220,255,190,.9)' : 'rgba(255,230,180,.95)');
      g.addColorStop(1, type === 'wildstaff' ? 'rgba(126,227,106,0)' : 'rgba(255,122,42,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(tipX, tipY, glow, 0, Math.PI * 2);
      c.fill();
      c.restore();
      return;
    }
    if (type === 'lute') {
      if (layer !== behind) return;
      // Luth tenu en travers, manche vers le haut ; au lancer, il se tourne vers la mire, les cordes vibrent et une
      // lueur rose pulse sur la caisse.
      const rest = side > 0 ? -0.65 : Math.PI + 0.65,
        rot = attacking ? rest + (aim - rest) * 0.35 * Math.sin(k * Math.PI) : rest,
        shake = attacking ? Math.sin(k * Math.PI * 6) * 1.5 : 0,
        bx = hx + shake,
        by = hy + 2;
      piece(c, 'lute', bx, by, rot, side);
      const glow = attacking
        ? 10 + 14 * (1 - k)
        : 5 + Math.sin((typeof time === 'number' ? time : 0) * 0.08) * 1.5;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(bx, by, 0, bx, by, glow);
      g.addColorStop(0, 'rgba(255,214,236,.8)');
      g.addColorStop(1, 'rgba(255,154,213,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(bx, by, glow, 0, Math.PI * 2);
      c.fill();
      c.restore();
      return;
    }
    if (type === 'grimoire') {
      if (layer !== behind) return;
      // Livre tenu devant soi, poussé vers la mire au lancer ; lueur de peste qui pulse au-dessus des pages.
      const d = attacking ? Math.sin(k * Math.PI) * 10 : 0,
        bx = hx + Math.cos(aim) * d,
        by = hy - 2 + Math.sin(aim) * d * 0.6,
        tilt = attacking ? Math.sin(k * Math.PI) * 0.3 * side : side * 0.12;
      piece(c, 'grimoire', bx, by, tilt, 1);
      const glow = attacking
        ? 12 + 16 * (1 - k)
        : 7 + Math.sin((typeof time === 'number' ? time : 0) * 0.08) * 2;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(bx, by - 6, 0, bx, by - 6, glow);
      g.addColorStop(0, 'rgba(210,255,140,.75)');
      g.addColorStop(1, 'rgba(164,232,60,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(bx, by - 6, glow, 0, Math.PI * 2);
      c.fill();
      c.restore();
      return;
    }
    if (type === 'bow') {
      if (layer !== behind) return;
      const rot = attacking ? aim : side > 0 ? -0.35 : Math.PI + 0.35,
        // Corde tirée au début, relâchée ensuite.
        pull = attacking ? (k < 0.35 ? ease(k / 0.35) : Math.max(0, 1 - (k - 0.35) * 6)) : 0,
        bx = attacking ? x + Math.cos(aim) * 16 : hx,
        by = attacking ? y + 2 + Math.sin(aim) * 10 : hy;
      piece(c, 'bow', bx, by, rot, 1);
      // Corde : des deux pointes jusqu'au point de tension.
      const ca = Math.cos(rot),
        sa = Math.sin(rot),
        nx = -sa,
        ny = ca,
        tip = 16 * SCALE,
        back = -2 * SCALE - pull * 9 * SCALE,
        t1x = bx + nx * tip - ca * 2 * SCALE,
        t1y = by + ny * tip - sa * 2 * SCALE,
        t2x = bx - nx * tip - ca * 2 * SCALE,
        t2y = by - ny * tip - sa * 2 * SCALE,
        mx = bx + ca * back,
        my = by + sa * back;
      c.save();
      c.strokeStyle = '#f2f0e0';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(t1x, t1y);
      c.lineTo(mx, my);
      c.lineTo(t2x, t2y);
      c.stroke();
      if (pull > 0.15) {
        // Flèche encochée.
        c.strokeStyle = '#2a1a10';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(mx, my);
        c.lineTo(mx + ca * 46, my + sa * 46);
        c.stroke();
        c.strokeStyle = '#c8a070';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(mx, my);
        c.lineTo(mx + ca * 44, my + sa * 44);
        c.stroke();
        c.fillStyle = '#e0e8f0';
        c.beginPath();
        c.moveTo(mx + ca * 50, my + sa * 50);
        c.lineTo(mx + ca * 42 + nx * 4, my + sa * 42 + ny * 4);
        c.lineTo(mx + ca * 42 - nx * 4, my + sa * 42 - ny * 4);
        c.fill();
      }
      c.restore();
      return;
    }
    if (type === 'shield') {
      if (layer !== behind) return;
      // Coup de bouclier : poussée vers la mire.
      const d = attacking ? Math.sin(k * Math.PI) * 16 : 0,
        sx = x + Math.cos(aim) * (14 + d),
        sy = y + 6 + Math.sin(aim) * (8 + d * 0.6);
      if (attacking && k < 0.6) {
        c.save();
        c.globalAlpha *= 0.45 * (1 - k / 0.6);
        c.fillStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 16;
        c.beginPath();
        c.arc(sx + Math.cos(aim) * 12, sy + Math.sin(aim) * 8, 18, aim - 1.1, aim + 1.1);
        c.arc(sx + Math.cos(aim) * 12, sy + Math.sin(aim) * 8, 8, aim + 1.1, aim - 1.1, true);
        c.fill();
        c.restore();
      }
      piece(c, 'shield', sx, sy, attacking ? Math.sin(k * Math.PI) * 0.25 * side : 0, 1);
    }
  }
  // ---------------------------------------------------------------- Projectiles
  // Flèche (arc) : hampe, pointe et empennage dans le sens du vol, avec une fine traînée. Orbe (bâton, et tout le
  // reste) : cœur blanc, halo coloré et sillage qui s'estompe.
  function drawProjectile(c, p) {
    const a = Number.isFinite(p.a) ? p.a : Math.atan2(p.vy || 0, p.vx || 0),
      ca = Math.cos(a),
      sa = Math.sin(a),
      col = p.c || '#ffffff';
    // Projectiles des classes (boule de feu, épine, dague, flèche lourde…) : vfx-art.js.
    if (CANAAN_VFX.projectile(c, p)) return;
    c.save();
    if (p.kind === 'arrow') {
      c.globalAlpha = 0.35;
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(p.x - ca * 14, p.y - sa * 14);
      c.lineTo(p.x - ca * 40, p.y - sa * 40);
      c.stroke();
      c.globalAlpha = 1;
      c.strokeStyle = '#2a1a10';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(p.x - ca * 16, p.y - sa * 16);
      c.lineTo(p.x + ca * 10, p.y + sa * 10);
      c.stroke();
      c.strokeStyle = '#c8a070';
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#e8eef4';
      c.beginPath();
      c.moveTo(p.x + ca * 16, p.y + sa * 16);
      c.lineTo(p.x + ca * 8 - sa * 4.5, p.y + sa * 8 + ca * 4.5);
      c.lineTo(p.x + ca * 8 + sa * 4.5, p.y + sa * 8 - ca * 4.5);
      c.fill();
      c.fillStyle = col;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(p.x - ca * 10, p.y - sa * 10);
        c.lineTo(p.x - ca * 17 - sa * 5 * s, p.y - sa * 17 + ca * 5 * s);
        c.lineTo(p.x - ca * 13, p.y - sa * 13);
        c.fill();
      }
    } else if (p.kind === 'comet') {
      // Comète (bâton, attaque lourde) : grosse boule ardente et longue traînée qui s'effile derrière elle.
      c.globalCompositeOperation = 'lighter';
      const tail = c.createLinearGradient(p.x, p.y, p.x - ca * 90, p.y - sa * 90);
      tail.addColorStop(0, col);
      tail.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = tail;
      c.globalAlpha = 0.75;
      c.beginPath();
      c.moveTo(p.x - sa * 18, p.y + ca * 18);
      c.lineTo(p.x - ca * 90, p.y - sa * 90);
      c.lineTo(p.x + sa * 18, p.y - ca * 18);
      c.closePath();
      c.fill();
      for (let k = 5; k >= 1; k--) {
        c.globalAlpha = 0.12 * (6 - k);
        c.fillStyle = col;
        c.beginPath();
        c.arc(p.x - ca * k * 13, p.y - sa * k * 13, 16 - k * 2, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      const pulse = 1 + 0.08 * Math.sin(performance.now() / 50),
        g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 * pulse);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#ffffff');
      g.addColorStop(0.55, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, 26 * pulse, 0, Math.PI * 2);
      c.fill();
    } else if (p.kind === 'plague') {
      // Crachat de peste (grimoire, attaque lourde) : boule toxique bouillonnante, cœur sombre et bulles.
      const wob = performance.now() / 90 + p.x * 0.05;
      c.globalAlpha = 0.4;
      c.fillStyle = '#3d5a1a';
      for (let k = 1; k <= 3; k++) {
        c.beginPath();
        c.arc(p.x - ca * k * 8, p.y - sa * k * 8, 7 - k * 1.5, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 0.9;
      c.fillStyle = col;
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a2 = (k / 8) * Math.PI * 2,
          r = 9 + Math.sin(wob + k * 1.7) * 2;
        c[k ? 'lineTo' : 'moveTo'](p.x + Math.cos(a2) * r, p.y + Math.sin(a2) * r);
      }
      c.closePath();
      c.fill();
      c.fillStyle = '#2a3a12';
      c.beginPath();
      c.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#e8ffb0';
      for (let k = 0; k < 2; k++) {
        c.beginPath();
        c.arc(p.x + Math.cos(wob + k * 3) * 6, p.y + Math.sin(wob * 1.3 + k * 3) * 6, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    } else if (p.kind === 'note') {
      // Note (luth, attaque lourde) : une croche lumineuse qui file.
      c.shadowColor = col;
      c.shadowBlur = 12;
      c.fillStyle = col;
      c.strokeStyle = col;
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(p.x - 3, p.y + 6, 6, 4.5, -0.4, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(p.x + 2.5, p.y + 5);
      c.lineTo(p.x + 2.5, p.y - 12);
      c.quadraticCurveTo(p.x + 10, p.y - 8, p.x + 9, p.y - 1);
      c.stroke();
    } else {
      c.globalCompositeOperation = 'lighter';
      for (let k = 3; k >= 1; k--) {
        c.globalAlpha = 0.18 * (4 - k);
        c.fillStyle = col;
        c.beginPath();
        c.arc(p.x - ca * k * 9, p.y - sa * k * 9, 7 - k * 1.4, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, 14, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  window.canaanDrawProjectile = drawProjectile;
  window.CANAAN_WEAPON_LOOK = Object.freeze({
    draw,
    faceFromAim,
    aimOf,
    weaponOf,
    lunge,
    kinds: () => Object.keys(ART)
  });
})();
