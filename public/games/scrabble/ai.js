// The computer player. Expert plays the best score plus a small bonus for
// the letters it keeps; the other levels aim at a share of the best score,
// easy with short words only. With no move it swaps (if the bag allows) or
// passes.
import { generateMoves } from "./movegen.js";
import { BLANK, RACK_SIZE, VOWELS } from "./tiles.js";

export const LEVEL_IDS = ["easy", "medium", "hard", "expert"];

const TARGET = { easy: 0.3, medium: 0.55, hard: 0.8 };
const KEEP = {
  [BLANK]: 22,
  S: 7,
  E: 2,
  R: 1,
  Q: -7,
  J: -2,
  K: -3,
  W: -4,
  Y: -3
};
const SWAP_KEEP = new Set([BLANK, "S", "E"]);

function leftover(rack, tiles) {
  const left = rack.slice();
  tiles.forEach(({ l }) => {
    const letter = l === l.toLowerCase() ? BLANK : l;
    left.splice(left.indexOf(letter), 1);
  });
  return left;
}

// Rough value of the letters kept for the next turn.
function leaveValue(left) {
  let value = left.reduce((sum, letter) => sum + (KEEP[letter] || 0), 0);
  const vowels = left.filter((l) => VOWELS.has(l)).length;
  value -=
    2 *
    Math.abs(vowels - (left.length - vowels - (left.includes(BLANK) ? 1 : 0)));
  const dupes = left.length - new Set(left).size;
  return value - 3 * dupes;
}

function pickExpert(moves, rack, bagCount) {
  if (!bagCount) return moves.reduce((a, b) => (b.score > a.score ? b : a));
  const rated = moves.map((m) => [
    m.score + leaveValue(leftover(rack, m.tiles)),
    m
  ]);
  return rated.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
}

function pickTarget(moves, level) {
  const pool =
    level === "easy" ? moves.filter((m) => m.word.length <= 6) : moves;
  const list = pool.length ? pool : moves;
  const best = Math.max(...list.map((m) => m.score));
  const target = best * TARGET[level];
  const near = list
    .map((m) => [Math.abs(m.score - target), m])
    .sort((a, b) => a[0] - b[0])
    .slice(0, 6);
  return near[Math.floor(Math.random() * near.length)][1];
}

function noMove(rack, bagCount) {
  if (bagCount < RACK_SIZE) return { kind: "pass" };
  const letters = rack.filter((l) => !SWAP_KEEP.has(l));
  return letters.length
    ? { kind: "swap", letters }
    : { kind: "swap", letters: rack.slice() };
}

// -> { kind: "play", tiles, score, word } | { kind: "swap", letters } | { kind: "pass" }
export function chooseMove({ board, rack, bagCount, level, dict }) {
  const moves = generateMoves(board, rack, dict);
  if (!moves.length) return noMove(rack, bagCount);
  const move =
    level === "expert"
      ? pickExpert(moves, rack, bagCount)
      : pickTarget(moves, level);
  return { kind: "play", ...move };
}

// The best-scoring move for a hint, or null.
export function bestMove(board, rack, dict) {
  const moves = generateMoves(board, rack, dict);
  return moves.length
    ? moves.reduce((a, b) => (b.score > a.score ? b : a))
    : null;
}
