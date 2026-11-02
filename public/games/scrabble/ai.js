// The computer player. Expert plays the best score plus a small bonus for
// the letters it keeps; the other levels aim at a share of the best score,
// junior and easy with short words only. Junior is played on the Junior
// board (tiles.js), where only coloured squares score. With no move it swaps
// (if the bag allows) or passes.
import { isKidFriendly } from "./junior-words.js";
import { generateMoves } from "./movegen.js";
import { BLANK, RACK_SIZE, VOWELS } from "./tiles.js";

export const LEVEL_IDS = ["junior", "easy", "medium", "hard", "expert"];

const TARGET = { junior: 0.35, easy: 0.3, medium: 0.55, hard: 0.8 };
// Word lengths a level prefers, tried in order (junior: 3–4 letters, else ≤ 4).
const LENGTHS = {
  junior: [
    [3, 4],
    [2, 4]
  ],
  easy: [[2, 6]]
};
const JUNIOR_HINT_MAX = 5;
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

function preferredMoves(moves, level) {
  for (const [min, max] of LENGTHS[level] || []) {
    const pool = moves.filter(
      (m) => m.word.length >= min && m.word.length <= max
    );
    if (pool.length) return pool;
  }
  return moves;
}

function pickTarget(moves, level) {
  const list = preferredMoves(moves, level);
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
  const moves = movesFor(board, rack, dict, level === "junior");
  if (!moves.length) return noMove(rack, bagCount);
  const move =
    level === "expert"
      ? pickExpert(moves, rack, bagCount)
      : pickTarget(moves, level);
  return { kind: "play", ...move };
}

// Junior leaves out rude words (junior-words.js).
function movesFor(board, rack, dict, junior) {
  const moves = generateMoves(board, rack, dict);
  return junior ? moves.filter((m) => isKidFriendly(m.word)) : moves;
}

// Up to `count` hints, best score first, one per main word (the same word
// elsewhere is not a new idea). Junior: main word ≤ 5 letters if possible,
// no rude word.
export function hintMoves(board, rack, dict, junior = false, count = 3) {
  const maxLength = junior ? JUNIOR_HINT_MAX : Infinity;
  const all = movesFor(board, rack, dict, junior);
  const short = all.filter((m) => m.word.length <= maxLength);
  const moves = (short.length ? short : all).sort((a, b) => b.score - a.score);
  const words = new Set();
  const picks = [];
  for (const move of moves) {
    if (picks.length === count) break;
    if (words.has(move.word)) continue;
    words.add(move.word);
    picks.push(move);
  }
  return picks;
}
