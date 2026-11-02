// Question bank: /data/trivialpursuit/questions_fr.json holds one list per
// category of [question, answer, info?]. Questions already asked are kept
// in localStorage across matches so they only come back once a category
// has been used up.
import { CATS } from "./board.js";
import { readJson, writeStorage } from "./store.js";

const DATA_URL = "/data/trivialpursuit/questions_fr.json";
const SEEN_KEY = "trivialpursuit-seen";

const isText = (v) => typeof v === "string" && v.length > 0 && v.length < 600;

const isItem = (item) =>
  Array.isArray(item) &&
  (item.length === 2 || item.length === 3) &&
  item.every(isText);

function validate(data) {
  const cats = data?.categories;
  if (!Array.isArray(cats) || cats.length !== CATS) return null;
  if (!cats.every((list) => Array.isArray(list) && list.length > 0))
    return null;
  return cats.map((list) => list.filter(isItem));
}

export async function loadDeck() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`questions: HTTP ${response.status}`);
  const cats = validate(await response.json());
  if (!cats || cats.some((list) => list.length === 0)) {
    throw new Error("questions: invalid data");
  }
  return createDeck(cats);
}

function loadSeen(cats) {
  const stored = readJson(SEEN_KEY);
  return cats.map((list, c) => {
    const ids = Array.isArray(stored?.[c]) ? stored[c] : [];
    return new Set(
      ids.filter((i) => Number.isInteger(i) && i >= 0 && i < list.length)
    );
  });
}

function createDeck(cats) {
  const seen = loadSeen(cats);
  const save = () =>
    writeStorage(SEEN_KEY, JSON.stringify(seen.map((set) => [...set])));

  function draw(cat, avoid = -1) {
    const list = cats[cat];
    if (seen[cat].size >= list.length) seen[cat].clear();
    const open = [];
    for (let i = 0; i < list.length; i += 1) {
      if (!seen[cat].has(i) && i !== avoid) open.push(i);
    }
    const pick = open.length
      ? open[Math.floor(Math.random() * open.length)]
      : Math.floor(Math.random() * list.length);
    seen[cat].add(pick);
    save();
    return pick;
  }

  function get(cat, index) {
    const item = cats[cat]?.[index];
    return item ? { q: item[0], a: item[1], info: item[2] || "" } : null;
  }

  return { draw, get, size: (cat) => cats[cat].length };
}
