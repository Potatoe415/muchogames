// Tile sets per word language and the board. A board cell holds "" (empty),
// an uppercase letter (normal tile) or a lowercase letter (a blank played as
// that letter, worth 0). In a rack "?" is a blank. One set and one board are
// active at a time (useTileSet, useJunior), set by the match being played:
// classic 15×15 with 7-letter racks, or Junior (Scrabble Junior, side 2):
// 11×11, 5-letter racks, points only from coloured squares.
export let JUNIOR = false;
export let SIZE = 15;
export let CELLS = SIZE * SIZE;
export let CENTER = 7 * SIZE + 7;
export let RACK_SIZE = 7;
export let PREMIUM = "";
export const BINGO = 50;
export const BLANK = "?";

// "letter count value": French 102 tiles (official), English 100 (official),
// Spanish 100 (official minus the CH, LL and RR tiles, written with two
// letters here; their three tiles go to C, L and R). "mix" is the bag of a
// match with Spanish and another language: French values, counts between
// French and Spanish, every letter of the three plus the Ñ (102 tiles).
// French + English uses the French bag.
const SETS = {
  mix: "A10:1 B2:3 C3:3 D4:2 E13:1 F2:4 G2:2 H2:4 I6:1 J1:8 K1:10 L5:1 M3:2 N6:1 Ñ1:8 O7:1 P2:3 Q1:8 R6:1 S6:1 T5:1 U6:1 V2:4 W1:10 X1:10 Y1:10 Z1:10",
  fr: "A9:1 B2:3 C2:3 D3:2 E15:1 F2:4 G2:2 H2:4 I8:1 J1:8 K1:10 L5:1 M3:2 N6:1 O6:1 P2:3 Q1:8 R6:1 S6:1 T6:1 U6:1 V2:4 W1:10 X1:10 Y1:10 Z1:10",
  en: "A9:1 B2:3 C2:3 D4:2 E12:1 F2:4 G3:2 H2:4 I9:1 J1:8 K1:5 L4:1 M2:3 N6:1 O8:1 P2:3 Q1:10 R6:1 S4:1 T6:1 U4:1 V2:4 W2:4 X1:8 Y2:4 Z1:10",
  es: "A12:1 B2:3 C5:3 D5:2 E12:1 F1:4 G2:2 H2:4 I6:1 J1:8 L5:1 M2:3 N5:1 Ñ1:8 O9:1 P2:3 Q1:5 R6:1 S6:1 T4:1 U5:1 V1:4 X1:8 Y1:4 Z1:10"
};

export const WORD_LANGS = ["fr", "en", "es"];

// Tile set of the word languages of a match (one or more of WORD_LANGS).
export function tileSetFor(words) {
  if (words.length === 1) return words[0];
  return words.includes("es") ? "mix" : "fr";
}

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

const JUNIOR_TILES = 60;

// Junior bag: the language's counts scaled down to 60 tiles with the two
// blanks, at least one of each letter, rounded by largest remainder.
function juniorCounts() {
  const letters = Object.entries(set).filter(([l]) => l !== BLANK);
  const target = JUNIOR_TILES - set[BLANK][0];
  const total = letters.reduce((sum, [, [count]]) => sum + count, 0);
  const rows = letters.map(([letter, [count]]) => {
    const exact = (count * target) / total;
    const rest = exact >= 1 ? exact % 1 : 0; // rare letters already got 1
    return { letter, n: Math.max(1, Math.floor(exact)), rest };
  });
  let left = target - rows.reduce((sum, r) => sum + r.n, 0);
  const byRest = rows.slice().sort((a, b) => b.rest - a.rest);
  const byCount = rows.slice().sort((a, b) => b.n - a.n);
  for (let k = 0; left > 0; k++, left--) byRest[k % byRest.length].n++;
  for (let k = 0; left < 0; k++, left++) byCount[k % byCount.length].n--;
  return [...rows.map((r) => [r.letter, r.n]), [BLANK, set[BLANK][0]]];
}

export function fullBag() {
  const counts = JUNIOR
    ? juniorCounts()
    : Object.entries(set).map(([letter, [count]]) => [letter, count]);
  return counts.flatMap(([letter, count]) => Array(count).fill(letter));
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Top half of each board down to the centre row, mirrored below.
// Classic: T = word ×3, D = word ×2 (* = centre, word ×2), t = letter ×3,
// d = letter ×2. Junior: coloured squares g = 1 point, b = 2, r = 3, * = star.
const CLASSIC_TOP = [
  "T..d...T...d..T",
  ".D...t...t...D.",
  "..D...d.d...D..",
  "d..D...d...D..d",
  "....D.....D....",
  ".t...t...t...t.",
  "..d...d.d...d..",
  "T..d...*...d..T"
];
const JUNIOR_TOP = [
  "r..g...g..r",
  ".b...g...b.",
  "..g.b.b.g..",
  "g..r...r..g",
  "..b.g.g.b..",
  ".g...*...g."
];
const COLOR_POINTS = { g: 1, b: 2, r: 3 };

const mirror = (top) => [...top, ...top.slice(0, -1).reverse()].join("");

export function useJunior(on) {
  JUNIOR = on;
  SIZE = on ? 11 : 15;
  CELLS = SIZE * SIZE;
  CENTER = Math.floor(CELLS / 2);
  RACK_SIZE = on ? 5 : 7;
  PREMIUM = mirror(on ? JUNIOR_TOP : CLASSIC_TOP);
}

useJunior(false);

export function letterFactor(index) {
  const p = JUNIOR ? "" : PREMIUM[index];
  return p === "t" ? 3 : p === "d" ? 2 : 1;
}

export function wordFactor(index) {
  const p = JUNIOR ? "" : PREMIUM[index];
  return p === "T" ? 3 : p === "D" || p === "*" ? 2 : 1;
}

// Junior: points of the coloured square under a newly placed letter.
export const colorPoints = (index) => COLOR_POINTS[PREMIUM[index]] || 0;

export const rackValue = (rack) =>
  rack.reduce((sum, letter) => sum + tileValue(letter), 0);
