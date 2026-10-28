// Score of one contract, duplicate style: every deal stands alone
// (part-score +50, game +300 / +500 vulnerable, slams, doubles).
import { CLUBS, DIAMONDS, NT } from "./cards.js";

const trickValue = (strain) =>
  strain === CLUBS || strain === DIAMONDS ? 20 : 30;

function contractPoints(level, strain) {
  if (strain === NT) return 40 + 30 * (level - 1);
  return trickValue(strain) * level;
}

function overtrickPoints(count, strain, doubled, vulnerable) {
  if (!doubled) return count * trickValue(strain);
  return count * (vulnerable ? 200 : 100) * doubled;
}

function madeScore({ level, strain, doubled }, overtricks, vulnerable) {
  const base = contractPoints(level, strain) * [1, 2, 4][doubled];
  let score = base;
  score += base >= 100 ? (vulnerable ? 500 : 300) : 50;
  if (level === 6) score += vulnerable ? 750 : 500;
  if (level === 7) score += vulnerable ? 1500 : 1000;
  score += [0, 50, 100][doubled];
  return score + overtrickPoints(overtricks, strain, doubled, vulnerable);
}

function undertrickPoints(count, doubled, vulnerable) {
  if (!doubled) return count * (vulnerable ? 100 : 50);
  let total = 0;
  for (let i = 1; i <= count; i += 1) {
    if (vulnerable) total += i === 1 ? 200 : 300;
    else total += i === 1 ? 100 : i <= 3 ? 200 : 300;
  }
  return total * doubled;
}

// Points for the declaring side: positive when made, negative when down.
export function contractScore(contract, tricks, vulnerable) {
  const needed = contract.level + 6;
  if (tricks >= needed) {
    return madeScore(contract, tricks - needed, vulnerable);
  }
  return -undertrickPoints(needed - tricks, contract.doubled, vulnerable);
}
