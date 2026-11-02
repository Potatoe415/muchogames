// Word lists per word language (2–15 letters, uppercase), each loaded once
// per page: French ODS 9, English ENABLE, Spanish an-array-of-spanish-words.
// File format: see scripts/scrabble_dict.mjs. Lookups are binary searches
// over the sorted array, which keeps memory low on phones.
const FILES = { fr: "ods9.txt", en: "enable.txt", es: "es.txt" };

const loading = new Map();

function decode(text) {
  const lines = text.split(/\r?\n/);
  const words = [];
  let prev = "";
  for (const line of lines) {
    if (!line) continue;
    prev = prev.slice(0, parseInt(line[0], 36)) + line.slice(1);
    words.push(prev);
  }
  return words;
}

function lowerBound(words, key) {
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (words[mid] < key) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function createDictionary(words) {
  return {
    size: words.length,
    has: (word) => words[lowerBound(words, word)] === word,
    hasPrefix: (prefix) =>
      words[lowerBound(words, prefix)]?.startsWith(prefix) ?? false
  };
}

// Several word languages in one match: a word counts if any list has it.
export function combineDictionaries(dicts) {
  if (dicts.length === 1) return dicts[0];
  return {
    size: dicts.reduce((sum, d) => sum + d.size, 0),
    has: (word) => dicts.some((d) => d.has(word)),
    hasPrefix: (prefix) => dicts.some((d) => d.hasPrefix(prefix))
  };
}

async function fetchDictionary(lang) {
  const url = new URL(`../../data/scrabble/${FILES[lang]}`, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`dictionary ${response.status}`);
  return createDictionary(decode(await response.text()));
}

// -> Promise<{ size, has(word), hasPrefix(prefix) }>; a failed load can retry.
export function loadDictionary(lang) {
  if (!loading.has(lang)) {
    const promise = fetchDictionary(lang).catch((error) => {
      loading.delete(lang);
      throw error;
    });
    loading.set(lang, promise);
  }
  return loading.get(lang);
}
