import { GRIDS } from "./config.js";
import { faceIds } from "./faces.js";

export function shuffle(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

function blank(faceId) {
  return { pairId: faceId, faceId, status: "IDLE" };
}

export function buildDeck(grid, themeId) {
  const { cols, rows } = GRIDS[grid];
  const pairs = (cols * rows) / 2;
  const picked = shuffle(faceIds(themeId)).slice(0, pairs);
  const cards = picked.flatMap((faceId) => [blank(faceId), blank(faceId)]);
  return shuffle(cards).map((card, index) => ({
    ...card,
    instanceId: `c${index}`
  }));
}
