// The computer opponent, pure (runs in Node). Both levels play the match's
// `turn` colour and take a winning drop when there is one.
// - easy: otherwise any legal column at random.
// - normal: otherwise blocks the opponent's winning drop, then avoids a
//   column that hands the opponent a win on top of its disc, then plays
//   nearest the centre (random between equally central columns).
import { COLUMNS, canDrop, drop } from "./rules.js";

export const LEVELS = ["easy", "normal"];
const CENTRE = (COLUMNS - 1) / 2;

const legalColumns = (match) =>
  Array.from({ length: COLUMNS }, (_, col) => col).filter((col) =>
    canDrop(match, col)
  );

const pick = (list, random) => list[Math.floor(random() * list.length)];

// A column where `player` would line up 4 if they dropped there now.
function winningColumn(match, player) {
  const asPlayer = { ...match, turn: player };
  return legalColumns(asPlayer).find(
    (col) => drop(asPlayer, col).winner === player
  );
}

// True when dropping in `col` lets the opponent win with their next disc.
function givesAway(match, col) {
  const after = drop(match, col);
  return !after.draw && winningColumn(after, after.turn) !== undefined;
}

function mostCentral(columns, random) {
  const distance = (col) => Math.abs(col - CENTRE);
  const best = Math.min(...columns.map(distance));
  return pick(
    columns.filter((col) => distance(col) === best),
    random
  );
}

// The column the bot drops in, or -1 when the match is over.
export function chooseColumn(match, level, random = Math.random) {
  const legal = legalColumns(match);
  if (!legal.length) return -1;
  const win = winningColumn(match, match.turn);
  if (win !== undefined) return win;
  if (level !== "normal") return pick(legal, random);
  const block = winningColumn(match, 3 - match.turn);
  if (block !== undefined) return block;
  const safe = legal.filter((col) => !givesAway(match, col));
  return mostCentral(safe.length ? safe : legal, random);
}
