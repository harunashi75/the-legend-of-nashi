// Maison en coopératif : l'hôte vérifie et applique les actions des invités (porte, meuble posé, retiré, tourné),
// envoie la maison à tous quand elle change, et chaque invité remplace la sienne par celle de l'hôte.
// Les actions arrivent déjà mises en forme par sanitizeAction (shared/net/messages.js) ; les meubles reçus sont
// revérifiés par les règles de la maison (shared/rules/house.js) avant d'être gardés.
// house.js appelle CANAAN_HOUSE_NET.create(maison) une fois et garde l'état ; ce fichier ne garde que la cadence
// d'envoi.
(() => {
  'use strict';
  // Vue envoyée : version et meubles en tableaux compacts [meuble, x, y, orientation].
  const encodeView = (version, items) => ({
    v: version,
    items: items.map(it => [it.k, it.x, it.y, it.r || 0])
  });
  // Vue reçue : meubles bruts (à vérifier), ou null si la vue est illisible.
  const decodeView = view =>
    view && Array.isArray(view.items)
      ? view.items.map(a => (Array.isArray(a) ? { k: a[0], x: a[1], y: a[2], r: a[3] || 0 } : null))
      : null;
  // Toutes les 5 secondes (300 ticks), la maison repart même sans changement : un invité qui arrive la reçoit.
  const RESEND_TICKS = 300;

  // house : { door, place, remove, rotate } (actions de l'hôte pour un héros), state() → { version, items },
  // receive(meubles bruts) pour un invité.
  function create(house) {
    let sent = -1,
      sentAt = -1e9;
    // Hôte : action d'un héros (le sien ou celui d'un invité). Renvoie vrai si elle a servi.
    function handle(hero, action) {
      if (action.op === 'house-door') return house.door(hero);
      if (action.op === 'house-place') return house.place(hero, action.k, action.x, action.y, action.r || 0);
      if (action.op === 'house-remove') return !!house.remove(hero, action.x, action.y);
      if (action.op === 'house-rotate') return house.rotate(hero, action.x, action.y);
      return false;
    }
    // Action du joueur de cet écran : appliquée tout de suite chez l'hôte, demandée à l'hôte chez un invité.
    const send = action =>
      game.mode === 'guest' ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    // Hôte : maison à envoyer aux invités, ou undefined si rien de neuf.
    function netView() {
      const { version, items } = house.state();
      if (version === sent && time - sentAt < RESEND_TICKS) return undefined;
      sent = version;
      sentAt = time;
      return encodeView(version, items);
    }
    // Invité : maison reçue de l'hôte.
    function applyRemote(view) {
      const raw = decodeView(view);
      if (raw) house.receive(raw);
    }
    return Object.freeze({ handle, send, netView, applyRemote });
  }
  window.CANAAN_HOUSE_NET = Object.freeze({ create, encodeView, decodeView });
})();
