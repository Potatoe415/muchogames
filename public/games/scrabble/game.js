// One match: board, bag, one rack and score per player (2 to 4; solo is you
// and the computer), turn, history. Pure state changes; the caller validates
// a placement (rules.js) before playTiles. The match ends when a player
// empties their rack with the bag empty, or after two scoreless turns per
// player in a row (each player passed or swapped twice).
import {
  BLANK,
  CELLS,
  fullBag,
  JUNIOR,
  LETTERS,
  RACK_SIZE,
  rackValue,
  shuffle
} from "./tiles.js";

const SCORELESS_ROUNDS = 2;

const asRackLetter = (l) => (l === l.toLowerCase() ? BLANK : l);

// seats: number of racks. chooser (optional): picks player 1's draws (Junior
// level, easy-draw.js).
export function createGame(seats, chooser) {
  const game = {
    board: Array(CELLS).fill(""),
    bag: shuffle(fullBag()),
    racks: Array.from({ length: seats }, () => []),
    scores: Array(seats).fill(0),
    turn: 0,
    history: [],
    scoreless: 0,
    over: null
  };
  game.racks.forEach((_, p) => refill(game, p, p === 0 ? chooser : undefined));
  return game;
}

function removeFromRack(rack, letter) {
  const k = rack.indexOf(letter);
  if (k >= 0) rack.splice(k, 1);
}

// chooser(rack, bag, need) -> bag indices; without one, the next tiles.
function refill(game, p, chooser) {
  const rack = game.racks[p];
  const need = Math.min(RACK_SIZE - rack.length, game.bag.length);
  if (need <= 0) return;
  const picks = chooser
    ? chooser(rack, game.bag, need)
    : [...game.bag.keys()].slice(-need);
  picks
    .sort((a, b) => b - a)
    .forEach((i) => rack.push(...game.bag.splice(i, 1)));
}

// The player who went out gains every other rack's value. Junior keeps the
// scores as they are: no rack adjustment at the end. A tie at the top is a
// draw (winner -1).
function finish(game, reason, outPlayer) {
  const left = game.racks.map((rack) => (JUNIOR ? 0 : rackValue(rack)));
  const adjust = left.map((value) => (value ? -value : 0));
  if (outPlayer >= 0) adjust[outPlayer] = left.reduce((sum, v) => sum + v, 0);
  adjust.forEach((value, p) => (game.scores[p] += value));
  const top = Math.max(...game.scores);
  const leaders = game.scores.flatMap((score, p) => (score === top ? [p] : []));
  game.over = {
    reason,
    adjust,
    winner: leaders.length === 1 ? leaders[0] : -1
  };
}

function endTurn(game) {
  const p = game.turn;
  const seats = game.racks.length;
  if (!game.racks[p].length && !game.bag.length) return finish(game, "out", p);
  if (game.scoreless >= SCORELESS_ROUNDS * seats)
    return finish(game, "blocked", -1);
  game.turn = (p + 1) % seats;
}

export function playTiles(game, tiles, analysis, chooser) {
  const p = game.turn;
  tiles.forEach(({ i, l }) => {
    game.board[i] = l;
    removeFromRack(game.racks[p], asRackLetter(l));
  });
  refill(game, p, chooser);
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

// Classic: swapping needs 7 tiles in the bag. Junior: any tile left.
export const canSwap = (game) => game.bag.length >= (JUNIOR ? 1 : RACK_SIZE);

// Junior: one letter swapped at the start of the turn, the turn goes on.
export function swapOne(game, letter, chooser) {
  removeFromRack(game.racks[game.turn], letter);
  refill(game, game.turn, chooser);
  game.bag = shuffle([...game.bag, letter]);
}

// New letters are drawn before the swapped ones go back into the bag.
export function swapTiles(game, letters, chooser) {
  const p = game.turn;
  letters.forEach((letter) => removeFromRack(game.racks[p], letter));
  refill(game, p, chooser);
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

// Letters the player p cannot see: the bag and the other racks (Junior racks
// are face up, so only the bag).
export const unseenLetters = (game, p) =>
  [
    ...game.bag,
    ...(JUNIOR ? [] : game.racks.filter((_, n) => n !== p).flat())
  ].sort();

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

function shapeValid(raw, seats) {
  return (
    Array.isArray(raw?.board) &&
    raw.board.length === CELLS &&
    raw.board.every((c) => c === "" || isLetter(c)) &&
    Array.isArray(raw.bag) &&
    raw.bag.every(isRackLetter) &&
    Array.isArray(raw.racks) &&
    raw.racks.length === seats &&
    raw.racks.every(
      (r) => Array.isArray(r) && r.length <= RACK_SIZE && r.every(isRackLetter)
    ) &&
    Array.isArray(raw.scores) &&
    raw.scores.length === seats &&
    raw.scores.every(Number.isInteger) &&
    isCount(raw.turn) &&
    raw.turn < seats &&
    Array.isArray(raw.history) &&
    isCount(raw.scoreless)
  );
}

// seats: racks the match must have. -> game or null when the save is damaged.
export function restoreGame(raw, seats) {
  if (!shapeValid(raw, seats)) return null;
  const game = {
    board: raw.board.slice(),
    bag: raw.bag.slice(),
    racks: raw.racks.map((r) => r.slice()),
    scores: raw.scores.slice(),
    turn: raw.turn,
    history: raw.history.filter((h) => isCount(h?.p) && h.p < seats),
    scoreless: raw.scoreless,
    over: null
  };
  return tilesComplete(game) ? game : null;
}
