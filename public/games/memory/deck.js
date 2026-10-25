import { GRIDS } from "./config.js";
import { FACES } from "./faces.js";

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

function blank(face) {
  return { pairId: face.id, faceId: face.id, status: "IDLE" };
}

export function buildDeck(grid) {
  const { cols, rows } = GRIDS[grid];
  const pairs = (cols * rows) / 2;
  const cards = FACES.slice(0, pairs).flatMap((face) => [
    blank(face),
    blank(face)
  ]);
  return shuffle(cards).map((card, index) => ({
    ...card,
    instanceId: `c${index}`
  }));
}
