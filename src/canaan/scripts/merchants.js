// Les portails restent dans npcs pour conserver l'accès aux instances.
// Conserver les PNJ internes : quêtes, événements et interactions en dépendent.
// Seul le rendu visuel est limité aux marchands et aux portails.
(() => {
  'use strict';
  const CANAAN_MERCHANT_SPRITES = new Map();
  // Marchand ambulant en pixels 26 × 32 (dessiné à l'échelle 2) : chapeau à large bord et plume, moustache,
  // manteau à boutons dorés, grand sac à dos chargé (tapis roulé, lanterne, casserole) et bourse à la main.
  // Couleurs propres à chaque village ; blink : yeux fermés (clignement).
  function merchantSprite(idx, blink) {
    const coats = [
      ['#2e5a4a', '#3f7a62', '#5a9a7e'],
      ['#6a2e3a', '#8a3e4a', '#b05a62'],
      ['#2e3e6a', '#3e548a', '#5a72b0'],
      ['#5a3e22', '#7a5630', '#9e7448'],
      ['#4a2e5a', '#64407a', '#8a5aa0'],
      ['#2e5a62', '#3e7a84', '#5aa0a8']
    ];
    const hats = ['#5a3a22', '#3a2a1e', '#6a4428', '#2a2430', '#4a3020', '#5a4a3a'];
    const feathers = ['#e05a3a', '#f0c040', '#5ab0e0', '#e0e0e0', '#8ae05a', '#e07ab0'];
    const skins = ['#e8b48a', '#c98e62', '#f0c7a0', '#a86c45', '#d8a07a', '#8a5a3a'];
    const hairs = ['#5a3a2a', '#e8e0d0', '#2a1f1a', '#a8442a', '#8a8a8a', '#c9a24a'];
    const [cd, cm, cl] = coats[idx % coats.length],
      hat = hats[idx % hats.length],
      feather = feathers[idx % feathers.length],
      skin = skins[idx % skins.length],
      hair = hairs[(idx * 5 + 1) % hairs.length],
      gold = '#e8c050';
    const spr = document.createElement('canvas');
    spr.width = 52;
    spr.height = 70;
    const a = spr.getContext('2d');
    a.imageSmoothingEnabled = false;
    // Deux rangées de marge en haut pour la plume.
    a.scale(2, 2);
    a.translate(0, 2);
    const R = (x, y, w, h, col) => {
      a.fillStyle = col;
      a.fillRect(x, y, w, h);
    };
    // Ombre.
    R(4, 30, 18, 2, '#080d1a55');
    // Grand sac à dos derrière les épaules : toile, sangles, tapis roulé, lanterne et casserole.
    R(4, 9, 18, 14, '#7a5a3a');
    R(5, 10, 16, 12, '#94704a');
    R(5, 10, 16, 1, '#b08a5a');
    R(3, 6, 20, 4, '#a8442a');
    R(3, 6, 20, 1, '#d06a44');
    R(3, 8, 20, 1, '#7a2e1e');
    for (let k = 0; k < 4; k++) R(5 + k * 5, 6, 1, 4, '#e8c060');
    R(21, 12, 3, 4, '#3a3a40');
    R(21, 12, 3, 1, '#7a7a84');
    R(22, 16, 1, 2, '#3a3a40');
    R(1, 12, 3, 5, '#3a2a1e');
    R(1, 13, 3, 3, '#ffd36b');
    R(2, 11, 1, 1, '#3a2a1e');
    // Jambes et bottes.
    R(9, 24, 3, 5, '#3a2e2a');
    R(14, 24, 3, 5, '#3a2e2a');
    R(8, 28, 5, 3, '#2a1e18');
    R(14, 28, 5, 3, '#2a1e18');
    R(8, 28, 5, 1, '#5a4030');
    R(14, 28, 5, 1, '#5a4030');
    // Long manteau : pans, devant clair, boutons dorés et ceinture.
    R(7, 13, 12, 13, cm);
    R(7, 13, 2, 13, cd);
    R(17, 13, 2, 13, cd);
    R(11, 13, 4, 12, cl);
    R(12, 14, 1, 1, gold);
    R(12, 17, 1, 1, gold);
    R(12, 20, 1, 1, gold);
    R(7, 19, 12, 2, '#3a2a1e');
    R(12, 19, 2, 2, gold);
    R(7, 25, 12, 1, cd);
    // Bretelles du sac par-dessus le manteau.
    R(9, 13, 1, 6, '#5a3e26');
    R(16, 13, 1, 6, '#5a3e26');
    // Bras : manche gauche le long du corps, main droite tenant une bourse.
    R(5, 14, 2, 8, cd);
    R(19, 14, 2, 6, cd);
    R(5, 21, 2, 2, skin);
    R(19, 19, 3, 2, skin);
    R(20, 20, 4, 4, '#8a6a3a');
    R(21, 20, 2, 1, '#c8a050');
    R(21, 22, 1, 1, gold);
    // Écharpe au cou.
    R(9, 12, 8, 2, feather);
    R(15, 13, 2, 3, feather);
    // Tête : visage, joues rosées, yeux, moustache et sourire.
    R(9, 5, 8, 7, skin);
    R(9, 10, 8, 2, '#00000014');
    R(10, 9, 1, 1, '#e88a7a');
    R(15, 9, 1, 1, '#e88a7a');
    if (blink) {
      R(10, 8, 2, 1, '#30272b');
      R(14, 8, 2, 1, '#30272b');
    } else {
      R(11, 7, 1, 2, '#30272b');
      R(14, 7, 1, 2, '#30272b');
      R(11, 7, 1, 1, '#ffffff66');
    }
    R(10, 10, 6, 1, hair);
    R(9, 10, 2, 1, hair);
    R(15, 10, 2, 1, hair);
    R(12, 11, 2, 1, '#8a4a40');
    R(8, 6, 1, 4, hair);
    R(17, 6, 1, 4, hair);
    // Chapeau à large bord, ruban et plume.
    R(5, 4, 16, 2, hat);
    R(5, 4, 16, 1, '#ffffff22');
    R(8, 0, 10, 4, hat);
    R(8, 3, 10, 1, feather);
    R(9, 0, 8, 1, '#ffffff1a');
    R(17, 0, 1, 3, feather);
    R(18, -1, 2, 2, feather);
    R(19, -2, 2, 2, '#ffffffaa');
    return canaanOutline(spr, 2);
  }
  function drawCanaanMerchant(c, n) {
    const key = n.village || CANAAN_CAMP.name,
      idx = Math.max(
        0,
        villages.findIndex(v => v.name === key)
      ),
      // Clignement d'yeux toutes les quelques secondes.
      blink = (time + Math.round(n.x)) % 260 < 8;
    const id = idx + (blink ? ':b' : '');
    let spr = CANAAN_MERCHANT_SPRITES.get(id);
    if (!spr) {
      spr = merchantSprite(idx, blink);
      CANAAN_MERCHANT_SPRITES.set(id, spr);
    }
    // Respiration lente ; pieds alignés au sol comme le héros.
    const breathe = Math.sin(time * 0.05 + n.x * 0.01) > 0.6 ? 1 : 0;
    c.drawImage(spr, Math.round(n.x - 27), Math.round(n.y - 50 - breathe), 54, 72 + breathe);
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, { drawCanaanMerchant });
})();
