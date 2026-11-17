// Règles de la maison et des pièces intérieures : place des meubles, orientations, chevauchements.
// Module partagé pur (shared/rules) : il reçoit le catalogue des meubles, la pièce et la liste des meubles posés
// en paramètres, et ne lit jamais l'état d'une partie. L'hôte s'en sert pour vérifier chaque meuble d'un invité.

// Un meuble mural (tableau, fenêtre, rideau) se pose toujours sur le mur du fond.
export function houseOnWall(furniture) {
  return furniture.layer === 'wall' || furniture.layer === 'curtain';
}

// Orientations : les meubles « turn » tournent d'un quart de tour (4 positions, la place au sol pivote) ;
// les autres se retournent en miroir (2 positions).
export function houseTurns(furniture) {
  return furniture.turn ? 4 : 2;
}

// Place au sol d'un meuble selon son orientation, en cases.
export function houseDims(furniture, r = 0) {
  return furniture.turn === true && r % 2
    ? { w: furniture.h, h: furniture.w }
    : { w: furniture.w, h: furniture.h };
}

// Pièce de w × h cases : mur du fond sur 2 rangées, sol de 1 à w-2 en x et de 2 à h-2 en y,
// murs latéraux, mur du bas avec la porte au milieu.
export function houseRoomGeometry(room) {
  return {
    floor: { x0: 1, x1: room.w - 2, y0: 2, y1: room.h - 2 },
    door: { x: Math.floor(room.w / 2), y: room.h - 2 }
  };
}

// Le meuble posé `item` ({ k, x, y, r }) couvre-t-il la case (lx, ly) de la pièce ?
export function houseCovers(catalog, item, lx, ly) {
  const furniture = catalog[item.k],
    d = houseDims(furniture, item.r),
    y0 = houseOnWall(furniture) ? 0 : item.y;
  return lx >= item.x && lx < item.x + d.w && ly >= y0 && ly < y0 + d.h;
}

// Le meuble k peut-il être posé en (x, y) avec l'orientation r, dans la pièce, à côté des meubles de la liste ?
// Le sol reste dans la pièce, un meuble « back » touche le mur du fond, le passage devant la porte reste libre,
// et deux meubles de la même couche ne se chevauchent jamais.
export function houseCanPlace(catalog, room, list, k, x, y, r, limit) {
  const furniture = Object.hasOwn(catalog, k) ? catalog[k] : null;
  if (
    !furniture ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    !Number.isInteger(r) ||
    r < 0 ||
    r >= houseTurns(furniture)
  )
    return false;
  const { floor: F, door: D } = houseRoomGeometry(room),
    d = houseDims(furniture, r),
    wall = houseOnWall(furniture);
  if (wall) y = 0;
  if (x < F.x0 || x + d.w - 1 > F.x1) return false;
  if (!wall) {
    if (y < F.y0 || y + d.h - 1 > F.y1) return false;
    if (furniture.back && y !== F.y0) return false;
    if (furniture.layer === 'floor' && x <= D.x && x + d.w > D.x && y <= D.y && y + d.h > D.y) return false;
  }
  if (list.length >= limit) return false;
  return !list.some(item => {
    const other = catalog[item.k];
    if (other.layer !== furniture.layer) return false;
    const od = houseDims(other, item.r),
      oy = houseOnWall(other) ? 0 : item.y;
    return x < item.x + od.w && item.x < x + d.w && y < oy + od.h && oy < y + d.h;
  });
}

// Le meuble visible le plus haut sur une case (rideau, puis mur, sol, tapis), ou null.
const LAYER_ORDER = ['curtain', 'wall', 'floor', 'rug'];
export function houseTopItemAt(catalog, list, lx, ly) {
  let best = null;
  for (const item of list)
    if (
      houseCovers(catalog, item, lx, ly) &&
      (!best || LAYER_ORDER.indexOf(catalog[item.k].layer) < LAYER_ORDER.indexOf(catalog[best.k].layer))
    )
      best = item;
  return best;
}

// Orientation suivante d'un meuble posé (quart de tour ou miroir) qui a encore la place, ou null.
export function houseNextRotation(catalog, room, list, item, limit) {
  const furniture = catalog[item.k],
    others = list.filter(o => o !== item);
  for (let step = 1; step < houseTurns(furniture); step++) {
    const r = ((item.r || 0) + step) % houseTurns(furniture);
    if (houseCanPlace(catalog, room, others, item.k, item.x, item.y, r, limit)) return r;
  }
  return null;
}

// Meubles d'une pièce lus d'une sauvegarde ou du réseau : seuls les meubles connus, bien placés et sans
// chevauchement sont gardés, dans l'ordre ; un meuble mural revient sur le mur du fond.
export function houseSanitizeItems(catalog, room, raw, limit) {
  const out = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    const r = Number.isInteger(item?.r) ? item.r : 0;
    if (
      item &&
      Object.hasOwn(catalog, item.k) &&
      houseCanPlace(catalog, room, out, item.k, item.x, item.y, r, limit)
    )
      out.push({ k: item.k, x: item.x, y: houseOnWall(catalog[item.k]) ? 0 : item.y, r });
  }
  return out;
}

// Meubles fixes de chaque pièce, à partir de leur agencement ([meuble, x, y, orientation]) : un meuble mal placé
// est ignoré.
export function houseFurnishRooms(catalog, rooms, furnish, limit) {
  const out = {};
  for (const [id, list] of Object.entries(furnish))
    out[id] = houseSanitizeItems(
      catalog,
      rooms[id],
      list.map(([k, x, y, r = 0]) => ({ k, x, y, r })),
      limit
    );
  return out;
}
