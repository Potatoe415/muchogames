// Pure Connect Four rules on a 7-column x 6-row grid. No DOM: runs in Node.
// The board is an array of 7 columns, each listing its discs bottom first
// (1 = red, 2 = yellow), so a drop is a push and gravity is free.
export const COLUMNS = 7;
export const ROWS = 6;
export const PLAYERS = [1, 2];
const LINE = 4;
const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

// `first`: the colour that drops the first disc.
export function newMatch(first = 1) {
  return {
    board: Array.from({ length: COLUMNS }, () => []),
    first,
    turn: first,
    moves: [],
    winner: 0,
    line: [],
    draw: false
  };
}

export const discAt = (board, col, row) => board[col]?.[row] ?? 0;
export const isOver = (match) => match.winner !== 0 || match.draw;

export function canDrop(match, col) {
  return (
    !isOver(match) &&
    Number.isInteger(col) &&
    col >= 0 &&
    col < COLUMNS &&
    match.board[col].length < ROWS
  );
}

// The cells of the longest run through (col, row) along one direction.
function runThrough(board, col, row, [dc, dr]) {
  const player = discAt(board, col, row);
  const cells = [[col, row]];
  for (const sign of [1, -1]) {
    let c = col + dc * sign;
    let r = row + dr * sign;
    while (discAt(board, c, r) === player) {
      cells.push([c, r]);
      c += dc * sign;
      r += dr * sign;
    }
  }
  return cells;
}

// Four or more in a row through the given disc, else an empty list.
export function winningLine(board, col, row) {
  if (!discAt(board, col, row)) return [];
  for (const direction of DIRECTIONS) {
    const cells = runThrough(board, col, row, direction);
    if (cells.length >= LINE) return cells;
  }
  return [];
}

const isFull = (board) => board.every((column) => column.length === ROWS);

// A new match after `match.turn` drops a disc in `col` (other fields, such
// as `first`, are kept); the same match when the drop is not allowed
// (column full, match over, bad column).
export function drop(match, col) {
  if (!canDrop(match, col)) return match;
  const board = match.board.map((column) => [...column]);
  const row = board[col].length;
  board[col].push(match.turn);
  const line = winningLine(board, col, row);
  return {
    ...match,
    board,
    turn: line.length ? match.turn : 3 - match.turn,
    moves: [...match.moves, col],
    winner: line.length ? match.turn : 0,
    line,
    draw: !line.length && isFull(board)
  };
}

// Replays a list of columns from `first`; null when one of them is not a
// legal drop.
export function replay(moves, first = 1) {
  let match = newMatch(first);
  for (const col of moves) {
    if (!canDrop(match, col)) return null;
    match = drop(match, col);
  }
  return match;
}
