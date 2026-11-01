// Tile sets per word language and the 15×15 board. A board cell holds ""
// (empty), an uppercase letter (normal tile) or a lowercase letter (a blank
// played as that letter, worth 0). In a rack "?" is a blank. One set is
// active at a time (useTileSet), set by the match being played.
export const SIZE = 15;
export const CELLS = SIZE * SIZE;
export const CENTER = 7 * SIZE + 7;
export const RACK_SIZE = 7;
export const BINGO = 50;
export const BLANK = "?";

// "letter count value": French 102 tiles (official), English 100 (official),
// Spanish 100 (official minus the CH, LL and RR tiles, written with two
// letters here; their three tiles go to C, L and R).
const SETS = {
  fr: "A9:1 B2:3 C2:3 D3:2 E15:1 F2:4 G2:2 H2:4 I8:1 J1:8 K1:10 L5:1 M3:2 N6:1 O6:1 P2:3 Q1:8 R6:1 S6:1 T6:1 U6:1 V2:4 W1:10 X1:10 Y1:10 Z1:10",
  en: "A9:1 B2:3 C2:3 D4:2 E12:1 F2:4 G3:2 H2:4 I9:1 J1:8 K1:5 L4:1 M2:3 N6:1 O8:1 P2:3 Q1:10 R6:1 S4:1 T6:1 U4:1 V2:4 W2:4 X1:8 Y2:4 Z1:10",
  es: "A12:1 B2:3 C5:3 D5:2 E12:1 F1:4 G2:2 H2:4 I6:1 J1:8 L5:1 M2:3 N5:1 Ñ1:8 O9:1 P2:3 Q1:5 R6:1 S6:1 T4:1 U5:1 V1:4 X1:8 Y1:4 Z1:10"
};

export const WORD_LANGS = Object.keys(SETS);

function parseSet(text) {
  const set = { [BLANK]: [2, 0] };
  text.split(" ").forEach((item) => {
    const [, letter, count, value] = item.match(/^(\D)(\d+):(\d+)$/u);
    set[letter] = [Number(count), Number(value)];
  });
  return set;
}

let set = parseSet(SETS.fr);
export let LETTERS = "";
export let LETTER_INDEX = new Map();

export function useTileSet(lang) {
  set = parseSet(SETS[lang] || SETS.fr);
  LETTERS = Object.keys(set)
    .filter((l) => l !== BLANK)
    .join("");
  LETTER_INDEX = new Map([...LETTERS].map((l, n) => [l, n]));
}

useTileSet("fr");

export const alphabetOf = (lang) =>
  Object.keys(parseSet(SETS[lang] || SETS.fr))
    .filter((l) => l !== BLANK)
    .join("");

export const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

// Value of a rack letter or a board cell (lowercase = blank = 0).
export function tileValue(letter) {
  if (letter === BLANK || letter !== letter.toUpperCase()) return 0;
  return set[letter]?.[1] ?? 0;
}

export function fullBag() {
  return Object.entries(set).flatMap(([letter, [count]]) =>
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
