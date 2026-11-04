// The seven tetrominoes: shapes, colours, spawn position and SRS wall kicks.
// A piece is { type, rot, x, y }: (x, y) is the top-left of its bounding box
// on the grid, rot 0 = spawn, 1 = right (clockwise), 2 = flipped, 3 = left.
export const TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

// Soft pastels that keep the usual hue of each piece.
export const COLORS = {
  I: "#9ddbe3",
  O: "#f3e09a",
  T: "#c9b0ec",
  S: "#acdcb4",
  Z: "#f1aaaa",
  J: "#a8baf0",
  L: "#f5c79a"
};

const SHAPES = {
  I: ["....", "XXXX", "....", "...."],
  O: ["....", ".XX.", ".XX.", "...."],
  T: [".X.", "XXX", "..."],
  S: [".XX", "XX.", "..."],
  Z: ["XX.", ".XX", "..."],
  J: ["X..", "XXX", "..."],
  L: ["..X", "XXX", "..."]
};

const rotateCw = (m) =>
  m.map((_, r) => [...m[r]].map((__, c) => m[m.length - 1 - c][r]).join(""));

const cellsOf = (m) =>
  m.flatMap((row, r) =>
    [...row].flatMap((ch, c) => (ch === "X" ? [[c, r]] : []))
  );

function allRotations(shape) {
  const rotations = [];
  let m = shape;
  for (let i = 0; i < 4; i += 1) {
    rotations.push(cellsOf(m));
    m = rotateCw(m);
  }
  return rotations;
}

// CELLS[type][rot] = [[col, row], ...] inside the bounding box.
export const CELLS = Object.fromEntries(
  TYPES.map((type) => [type, allRotations(SHAPES[type])])
);

// Spawn columns 4-6 (I: 3-6, O: 4-5); y puts the top filled row on y = 0.
export const SPAWN = Object.fromEntries(
  TYPES.map((type) => [
    type,
    { x: 3, y: -Math.min(...CELLS[type][0].map(([, r]) => r)) }
  ])
);

// SRS kick tests, keyed "<from><to>", as [dx, dy] with y pointing UP (the
// published tables); kicksFor() flips y for our y-down grid.
const KICKS_JLSTZ = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const KICKS_I = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

// Offsets [dx, dy] to try, in order, for a rotation from -> to.
export function kicksFor(type, from, to) {
  if (type === "O") return [[0, 0]];
  const table = type === "I" ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}${to}`].map(([dx, dy]) => [dx, -dy]);
}
