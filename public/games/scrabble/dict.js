// The French Scrabble word list (ODS 9, 2–15 letters, uppercase), loaded once
// per page or worker. File format: see scripts/scrabble_dict.mjs. Lookups are
// binary searches over the sorted array, which keeps memory low on phones.
const DICT_URL = new URL("../../data/scrabble/ods9.txt", import.meta.url);

let loading = null;

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

// -> Promise<{ size, has(word), hasPrefix(prefix) }>; a failed load can retry.
export function loadDictionary() {
  loading ??= fetch(DICT_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`dictionary ${response.status}`);
      return response.text();
    })
    .then((text) => createDictionary(decode(text)))
    .catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}
