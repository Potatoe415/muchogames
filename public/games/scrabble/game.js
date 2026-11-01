// One match: board, bag, two racks, scores, turn, history. Pure state changes;
// the caller validates a placement (rules.js) before playTiles. The match ends
// when a player empties their rack with the bag empty, or after four turns in
// a row without points (each player passed or swapped twice).
import {
  BLANK,
  CELLS,
  fullBag,
  LETTERS,
  RACK_SIZE,
  rackValue,
  shuffle
} from "./tiles.js";

const SCORELESS_END = 4;

const asRackLetter = (l) => (l === l.toLowerCase() ? BLANK : l);

export function createGame() {
  const bag = shuffle(fullBag());
  const racks = [bag.splice(-RACK_SIZE), bag.splice(-RACK_SIZE)];
  return {
    board: Array(CELLS).fill(""),
    bag,
    racks,
    scores: [0, 0],
    turn: 0,
    history: [],
    scoreless: 0,
    over: null
  };
}

function removeFromRack(rack, letter) {
  const k = rack.indexOf(letter);
  if (k >= 0) rack.splice(k, 1);
}

function refill(game, p) {
  const rack = game.racks[p];
  while (rack.length < RACK_SIZE && game.bag.length) rack.push(game.bag.pop());
}

function finish(game, reason, outPlayer) {
  const left = game.racks.map(rackValue);
  const adjust = left.map((value) => -value);
  if (outPlayer >= 0) adjust[outPlayer] = left[1 - outPlayer];
  adjust.forEach((value, p) => (game.scores[p] += value));
  const [a, b] = game.scores;
  game.over = { reason, adjust, winner: a === b ? -1 : a > b ? 0 : 1 };
}

function endTurn(game) {
  const p = game.turn;
  if (!game.racks[p].length && !game.bag.length) return finish(game, "out", p);
  if (game.scoreless >= SCORELESS_END) return finish(game, "blocked", -1);
  game.turn = 1 - p;
}

export function playTiles(game, tiles, analysis) {
  const p = game.turn;
  tiles.forEach(({ i, l }) => {
    game.board[i] = l;
    removeFromRack(game.racks[p], asRackLetter(l));
  });
  refill(game, p);
  game.scores[p] += analysis.score;
  game.history.push({
    p,
    kind: "play",
    word: analysis.words[0].text,
    score: analysis.score,
    cells: tiles.map((t) => t.i)
  });
  game.scoreless = 0;
  endTurn(game);
}

export const canSwap = (game) => game.bag.length >= RACK_SIZE;

// New letters are drawn before the swapped ones go back into the bag.
export function swapTiles(game, letters) {
  const p = game.turn;
  letters.forEach((letter) => removeFromRack(game.racks[p], letter));
  refill(game, p);
  game.bag = shuffle([...game.bag, ...letters]);
  game.history.push({ p, kind: "swap", count: letters.length });
  game.scoreless += 1;
  endTurn(game);
}

export function passTurn(game) {
  game.history.push({ p: game.turn, kind: "pass" });
  game.scoreless += 1;
  endTurn(game);
}

// Letters the player p cannot see: the bag and the other rack.
export const unseenLetters = (game, p) =>
  [...game.bag, ...game.racks[1 - p]].sort();

export function bestPlay(game, p) {
  const plays = game.history.filter((h) => h.p === p && h.kind === "play");
  return plays.reduce((a, b) => (!a || b.score > a.score ? b : a), null);
}

// --- Save / restore ---

const isLetter = (s) =>
  typeof s === "string" && s.length === 1 && LETTERS.includes(s.toUpperCase());
const isRackLetter = (s) => s === BLANK || LETTERS.includes(s);
const isCount = (n) => Number.isInteger(n) && n >= 0;

// Every tile of the set is somewhere: board, bag or a rack.
function tilesComplete(game) {
  const all = [
    ...game.board.filter(Boolean).map(asRackLetter),
    ...game.bag,
    ...game.racks.flat()
  ].sort();
  return all.join("") === fullBag().sort().join("");
}

function shapeValid(raw) {
  return (
    Array.isArray(raw?.board) &&
    raw.board.length === CELLS &&
    raw.board.every((c) => c === "" || isLetter(c)) &&
    Array.isArray(raw.bag) &&
    raw.bag.every(isRackLetter) &&
    Array.isArray(raw.racks) &&
    raw.racks.length === 2 &&
    raw.racks.every(
      (r) => Array.isArray(r) && r.length <= RACK_SIZE && r.every(isRackLetter)
    ) &&
    Array.isArray(raw.scores) &&
    raw.scores.length === 2 &&
    raw.scores.every(Number.isInteger) &&
    (raw.turn === 0 || raw.turn === 1) &&
    Array.isArray(raw.history) &&
    isCount(raw.scoreless)
  );
}

// -> game or null when the save is damaged.
export function restoreGame(raw) {
  if (!shapeValid(raw)) return null;
  const game = {
    board: raw.board.slice(),
    bag: raw.bag.slice(),
    racks: raw.racks.map((r) => r.slice()),
    scores: raw.scores.slice(),
    turn: raw.turn,
    history: raw.history.filter((h) => h && (h.p === 0 || h.p === 1)),
    scoreless: raw.scoreless,
    over: null
  };
  return tilesComplete(game) ? game : null;
}
