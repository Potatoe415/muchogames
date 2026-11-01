// Builds public/data/scrabble/ods9.txt from a plain word list (one word per
// line, e.g. https://github.com/clementjosse/dico-scrabble liste_mots.txt).
// Usage: node scripts/scrabble_dict.mjs <source.txt>
// Output: sorted, uppercase, 2–15 letters, front-coded: each line is one
// base-36 digit (letters shared with the previous word) + the rest of the word.
// Decoded by public/games/scrabble/dict.js.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "data", "scrabble", "ods9.txt");

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/scrabble_dict.mjs <source.txt>");
  process.exit(1);
}

const words = [
  ...new Set(
    readFileSync(source, "utf8")
      .split(/\r?\n/)
      .map((w) => w.trim().toUpperCase())
      .filter((w) => /^[A-Z]{2,15}$/.test(w))
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
