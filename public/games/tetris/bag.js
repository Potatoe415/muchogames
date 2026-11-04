// 7-bag randomizer: every piece once per bag, in random order.
import { TYPES } from "./pieces.js";

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Takes the next piece out of `bag` (an array, refilled when empty).
export function draw(bag, rng) {
  if (bag.length === 0) bag.push(...shuffle([...TYPES], rng));
  return bag.shift();
}
