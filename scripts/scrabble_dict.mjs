// Builds a Scrabble word list in public/data/scrabble/ from a plain list (one
// word per line, or a JSON array of strings).
// Usage: node scripts/scrabble_dict.mjs <source> <lang> <out.txt>
//   fr: ods9.txt   from github.com/clementjosse/dico-scrabble liste_mots.txt
//   en: enable.txt from github.com/dolph/dictionary enable1.txt (public domain)
//   es: es.txt     from github.com/words/an-array-of-spanish-words index.json (MIT)
// Accents are dropped (Ñ is kept, it is its own tile); words with a letter
// that has no tile in that language are skipped. Output: sorted, uppercase,
// 2–15 letters, front-coded: each line is one base-36 digit (letters shared
// with the previous word) + the rest of the word. Decoded by
// public/games/scrabble/dict.js.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { alphabetOf } from "../public/games/scrabble/tiles.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [source, lang, outName] = process.argv.slice(2);
if (!source || !lang || !outName) {
  console.error(
    "Usage: node scripts/scrabble_dict.mjs <source> <lang> <out.txt>"
  );
  process.exit(1);
}
const OUT = join(ROOT, "public", "data", "scrabble", outName);
const allowed = new RegExp(`^[${alphabetOf(lang)}]{2,15}$`, "u");

function readWords(path) {
  const text = readFileSync(path, "utf8");
  return path.endsWith(".json") ? JSON.parse(text) : text.split(/\r?\n/);
}

const normalize = (word) =>
  word
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/N\u0303/g, "Ñ")
    .replace(/\p{M}/gu, "");

const words = [
  ...new Set(
    readWords(source)
      .map(normalize)
      .filter((w) => allowed.test(w))
  )
].sort();

let prev = "";
const lines = words.map((word) => {
  let keep = 0;
  while (keep < 14 && keep < prev.length && prev[keep] === word[keep]) keep++;
  prev = word;
  return keep.toString(36) + word.slice(keep);
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`${words.length} words -> ${OUT}`);
