// Builds the offline French definitions in public/data/scrabble/defs/fr/
// from the French Wiktionary extract of kaikki.org (wiktextract, CC BY-SA 4.0):
//   https://kaikki.org/frwiktionary/raw-wiktextract-data.jsonl.gz (~700 MB,
//   keep it outside the repo).
// Usage: node scripts/scrabble_defs.mjs <raw-wiktextract-data.jsonl.gz>
// Keeps the words of ods9.txt, plus the base words their inflected forms
// point to. One entry per board word (accents folded): lowercase titles
// first, then a definition over an inflection, then page order. Text = first
// sense, first sentence, ≤ 160 characters (same as the live lookup).
// Output: one file per first two letters of an ODS word (possibly empty),
// lines sorted by board word: "title<TAB>text", "title<TAB>text<TAB>base"
// (inflected form), or "title<TAB><TAB>base<TAB>n" = line n (base 36, from
// 0) of forms.txt with "~" replaced by base (inflection texts shared by 2+
// forms). Front-coded: title = one base-36 digit (letters kept from the
// previous line's title) + the rest; base = the same against its own title.
// Read by public/games/scrabble/define.js.
import { createReadStream, mkdirSync, readFileSync, rmSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";

import { fold, tidy } from "../public/games/scrabble/define.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public", "data", "scrabble");
const OUT = join(DATA, "defs", "fr");
const [source] = process.argv.slice(2);
if (!source) {
  console.error("Usage: node scripts/scrabble_defs.mjs <wiktextract.jsonl.gz>");
  process.exit(1);
}
const BOARD_WORD = /^[A-Z]{2,15}$/;

function readOds() {
  const words = new Set();
  let prev = "";
  for (const line of readFileSync(join(DATA, "ods9.txt"), "utf8").split("\n")) {
    if (!line) continue;
    prev = prev.slice(0, parseInt(line[0], 36)) + line.slice(1);
    words.add(prev);
  }
  return words;
}

async function* entries(path) {
  let rest = "";
  const stream = createReadStream(path).pipe(createGunzip());
  for await (const chunk of stream.setEncoding("utf8")) {
    const lines = (rest + chunk).split("\n");
    rest = lines.pop();
    for (const line of lines)
      if (line.includes('"lang_code": "fr"')) yield line;
  }
  if (rest.includes('"lang_code": "fr"')) yield rest;
}

const clean = (text) => text.replace(/\s+/g, " ").trim();

const shortText = (sense) => clean(tidy(sense.glosses?.[0] || ""));

function candidate(entry, order) {
  const sense = entry.senses?.find(shortText);
  if (!sense) return null;
  const formOf = sense.tags?.includes("form-of") && sense.form_of?.[0]?.word;
  return {
    title: entry.word,
    text: shortText(sense),
    base: formOf ? clean(formOf) : "",
    order
  };
}

const rank = (c) =>
  Number(c.title !== c.title.toLowerCase()) * 2 + Number(Boolean(c.base));

function better(a, b) {
  return !a || rank(b) < rank(a) || (rank(b) === rank(a) && b.order < a.order);
}

async function collect(keys, onlyDefinitions) {
  const best = new Map();
  let order = 0;
  for await (const line of entries(source)) {
    const entry = JSON.parse(line);
    if (entry.lang_code !== "fr" || typeof entry.word !== "string") continue;
    const key = fold(entry.word);
    if (!keys.has(key)) continue;
    const found = candidate(entry, order++);
    if (!found || (onlyDefinitions && found.base)) continue;
    if (better(best.get(key), found)) best.set(key, found);
  }
  return best;
}

const ods = readOds();
const table = await collect(ods, false);
const missingBases = new Set();
for (const entry of table.values()) {
  const key = entry.base && fold(entry.base);
  if (key && BOARD_WORD.test(key) && !table.has(key)) missingBases.add(key);
}
for (const [key, entry] of await collect(missingBases, true))
  table.set(key, entry);

const keys = [...table.keys()].sort();
for (const key of keys) {
  const entry = table.get(key);
  const baseKey = entry.base && fold(entry.base);
  const base = baseKey && baseKey !== key && table.get(baseKey);
  if (!base || base.base) entry.base = "";
}

// "Pluriel de maisons." -> "Pluriel de ~." when used by 2+ forms.
const templateOf = ({ text, base }) => {
  const at = base ? text.lastIndexOf(base) : -1;
  return at < 0 ? "" : text.slice(0, at) + "~" + text.slice(at + base.length);
};
const uses = new Map();
for (const entry of table.values()) {
  const template = templateOf(entry);
  if (template) uses.set(template, (uses.get(template) || 0) + 1);
}
const templates = [...uses]
  .filter(([template, count]) => count > 1 && template.split("~").length === 2)
  .sort((a, b) => b[1] - a[1])
  .map(([template]) => template);
const templateIndex = new Map(templates.map((t, n) => [t, n]));

// "<shared count, base 36><rest>": the start of `to` that `from` already has.
function frontCode(from, to) {
  let keep = 0;
  while (keep < 35 && keep < from.length && from[keep] === to[keep]) keep++;
  return keep.toString(36) + to.slice(keep);
}

const shards = new Map([...ods].map((word) => [word.slice(0, 2), []]));
let withBase = 0;
for (const key of keys) {
  const shard = key.slice(0, 2);
  if (!shards.has(shard)) shards.set(shard, []);
  shards.get(shard).push(table.get(key));
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const [shard, entries] of shards) {
  let prev = "";
  const lines = entries.map(({ title, text, base }) => {
    if (base) withBase++;
    const template = templateIndex.get(templateOf({ text, base }));
    const fields = [frontCode(prev, title)];
    prev = title;
    const coded = base && frontCode(title, base);
    if (template === undefined) fields.push(text, coded);
    else fields.push("", coded, template.toString(36));
    return fields.join("\t").replace(/\t$/, "");
  });
  const text = lines.length ? lines.join("\n") + "\n" : "";
  bytes += Buffer.byteLength(text);
  writeFileSync(join(OUT, `${shard}.txt`), text);
}
writeFileSync(join(OUT, "forms.txt"), templates.join("\n") + "\n");
const covered = [...ods].filter((w) => table.has(w)).length;
console.log(
  `${covered}/${ods.size} ODS words (${((100 * covered) / ods.size).toFixed(1)} %),` +
    ` ${missingBases.size} extra base words, ${withBase} with a base,` +
    ` ${shards.size} files, ${(bytes / 1e6).toFixed(1)} MB -> ${OUT}`
);
