// French Scrabble set (102 tiles) and the 15×15 board. A board cell holds ""
// (empty), an uppercase letter (normal tile) or a lowercase letter (a blank
// played as that letter, worth 0). In a rack "?" is a blank.
export const SIZE = 15;
export const CELLS = SIZE * SIZE;
export const CENTER = 7 * SIZE + 7;
export const RACK_SIZE = 7;
export const BINGO = 50;
export const BLANK = "?";
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// letter: [count, value]
const SET = {
  A: [9, 1],
  B: [2, 3],
  C: [2, 3],
  D: [3, 2],
  E: [15, 1],
  F: [2, 4],
  G: [2, 2],
  H: [2, 4],
  I: [8, 1],
  J: [1, 8],
  K: [1, 10],
  L: [5, 1],
  M: [3, 2],
  N: [6, 1],
  O: [6, 1],
  P: [2, 3],
  Q: [1, 8],
  R: [6, 1],
  S: [6, 1],
  T: [6, 1],
  U: [6, 1],
  V: [2, 4],
  W: [1, 10],
  X: [1, 10],
  Y: [1, 10],
  Z: [1, 10],
  [BLANK]: [2, 0]
};

export const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

// Value of a rack letter or a board cell (lowercase = blank = 0).
export function tileValue(letter) {
  if (letter === BLANK || letter !== letter.toUpperCase()) return 0;
  return SET[letter]?.[1] ?? 0;
}

export function fullBag() {
  return Object.entries(SET).flatMap(([letter, [count]]) =>
    Array(count).fill(letter)
  );
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// T = word ×3, D = word ×2 (* = centre, word ×2), t = letter ×3, d = letter ×2.
const TOP = [
  "T..d...T...d..T",
  ".D...t...t...D.",
  "..D...d.d...D..",
  "d..D...d...D..d",
  "....D.....D....",
  ".t...t...t...t.",
  "..d...d.d...d..",
  "T..d...*...d..T"
];

export const PREMIUM = [...TOP, ...TOP.slice(0, 7).reverse()].join("");

export function letterFactor(index) {
  const p = PREMIUM[index];
  return p === "t" ? 3 : p === "d" ? 2 : 1;
}

export function wordFactor(index) {
  const p = PREMIUM[index];
  return p === "T" ? 3 : p === "D" || p === "*" ? 2 : 1;
}

export const rackValue = (rack) =>
  rack.reduce((sum, letter) => sum + tileValue(letter), 0);
