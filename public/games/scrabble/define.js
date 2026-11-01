// Short definitions from Wiktionary. French: our own copy first
// (/data/scrabble/defs/fr/, built by scripts/scrabble_defs.mjs), the live
// API only for words missing there. Live (fr / en / es editions, CORS API,
// no key): board words have no accents, so the page is found with the
// accent-insensitive search; an inflected form ("pluriel de maison") is
// followed to its base word once. Wiktionary text is shown as plain text.
const OFFLINE = new Set(["fr"]);
const HOSTS = {
  fr: "fr.wiktionary.org",
  en: "en.wiktionary.org",
  es: "es.wiktionary.org"
};
const SECTION = { fr: "Français", en: "English", es: "Español" };
const PART_OF_SPEECH = {
  fr: /nom|verbe|adjectif|adverbe|pronom|préposition|conjonction|interjection|article|forme|locution|onomatopée|numéral|particule|lettre|symbole|préfixe|suffixe/i,
  en: /noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|article|determiner|numeral|particle|letter|symbol|prefix|suffix|contraction|abbreviation/i,
  es: /sustantivo|verbo|adjetivo|adverbio|pronombre|preposición|conjunción|interjección|artículo|forma|locución|onomatopeya|numeral|letra|símbolo|prefijo|sufijo/i
};
const INFLECTION =
  /^(plural|pluriel|forma|féminin|feminine|masculin|first|second|third|première|deuxième|troisième|primera|segunda|tercera|participe|participio|past|present|simple past|comparative|superlative|alternative|variante?|grafía|obsolete|ancienne orthographe)\b/i;
const MAX_LENGTH = 160;
const cache = new Map();
const files = new Map();

// "Été" -> "ETE", "cœur" -> "COEUR", keeps Ñ (its own tile).
export const fold = (text) =>
  text
    .toUpperCase()
    .replace(/Œ/g, "OE")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/N\u0303/g, "Ñ")
    .replace(/\p{M}/gu, "");

async function api(lang, params) {
  const query = new URLSearchParams({ format: "json", origin: "*", ...params });
  const response = await fetch(`https://${HOSTS[lang]}/w/api.php?${query}`, {
    headers: {
      "Api-User-Agent": "Muchogames/1.0 (https://www.muchogames.win/)"
    }
  });
  if (!response.ok) throw new Error(`wiktionary ${response.status}`);
  return response.json();
}

async function findTitles(lang, word) {
  const data = await api(lang, {
    action: "query",
    list: "search",
    srsearch: word.toLowerCase(),
    srnamespace: "0",
    srlimit: "10",
    srprop: ""
  });
  const titles = (data.query?.search || []).map((s) => s.title);
  const exact = titles.filter((title) => fold(title) === word);
  return exact.sort(
    (a, b) => Number(a !== a.toLowerCase()) - Number(b !== b.toLowerCase())
  );
}

async function pageText(lang, title) {
  const data = await api(lang, {
    action: "query",
    prop: "extracts",
    explaintext: "1",
    redirects: "1",
    titles: title
  });
  const page = Object.values(data.query?.pages || {})[0];
  return page?.extract || "";
}

function languageLines(text, lang) {
  const lines = text.split("\n").map((line) => line.trim());
  const start = lines.indexOf(`== ${SECTION[lang]} ==`);
  if (start < 0) return [];
  const end = lines.findIndex((line, n) => n > start && /^== [^=]/.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end);
}

// First definition line under a part-of-speech heading: skips the headword
// line (starts with the word) and bare sense numbers.
function firstDefinition(lines, lang, word) {
  let heading = "";
  for (const line of lines) {
    const match = line.match(/^={3,}\s*(.+?)\s*=+$/);
    if (match) heading = PART_OF_SPEECH[lang].test(match[1]) ? match[1] : "";
    else if (
      heading &&
      line &&
      !/^\d+(\s|$)/.test(line) &&
      !fold(line).startsWith(word)
    )
      return { heading, text: line };
  }
  return null;
}

// Drops leading "(Domain)" labels and "[notes]", keeps the first sentence.
export function tidy(text) {
  const plain = text
    .replace(/^(\([^)]*\)\s*)+/, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .trim();
  const first = (plain.match(/^.{15,}?[.;](?=\s)/)?.[0] || plain).replace(
    /\s*;$/,
    "."
  );
  return first.length > MAX_LENGTH
    ? `${first.slice(0, MAX_LENGTH - 1)}…`
    : first;
}

async function defineTitle(lang, title) {
  const found = firstDefinition(
    languageLines(await pageText(lang, title), lang),
    lang,
    fold(title)
  );
  return found && { ...found, text: tidy(found.text) };
}

function baseWord(found) {
  if (!INFLECTION.test(found.text) && !/^form/i.test(found.heading)) return "";
  return found.text.match(/([\p{L}'’-]+)\s*\.?$/u)?.[1] || "";
}

async function lookUp(lang, word) {
  for (const title of await findTitles(lang, word)) {
    const found = await defineTitle(lang, title);
    if (!found) continue;
    const base = baseWord(found);
    const baseFound =
      base && base !== title ? await defineTitle(lang, base) : null;
    return {
      title,
      text: found.text,
      base: baseFound ? base : "",
      baseText: baseFound?.text || ""
    };
  }
  return null;
}

// File format: see scripts/scrabble_defs.mjs.
async function fetchLines(lang, name) {
  const url = new URL(
    `../../data/scrabble/defs/${lang}/${name}.txt`,
    import.meta.url
  );
  const response = await fetch(url);
  if (!response.ok) throw new Error(`definitions ${response.status}`);
  return (await response.text()).split("\n");
}

// Each file fetched once per page; a failed fetch can retry.
function once(key, load) {
  if (!files.has(key)) {
    const promise = load();
    promise.catch(() => files.delete(key));
    files.set(key, promise);
  }
  return files.get(key);
}

const formTexts = (lang) =>
  once(`${lang}:forms`, () => fetchLines(lang, "forms"));

async function fetchShard(lang, prefix) {
  const lines = await fetchLines(lang, prefix);
  const forms = lines.some((line) => line.includes("\t\t"))
    ? await formTexts(lang)
    : [];
  const entries = new Map();
  for (const line of lines) {
    const [title, text, base = "", form] = line.split("\t");
    const shown = form ? forms[Number(form)]?.replace("~", base) : text;
    if (shown) entries.set(fold(title), { title, text: shown, base });
  }
  return entries;
}

const shard = (lang, word) =>
  once(`${lang}:${word.slice(0, 2)}`, () => fetchShard(lang, word.slice(0, 2)));

async function lookUpOffline(lang, word) {
  const found = (await shard(lang, word)).get(word);
  if (!found) return null;
  const baseWord = fold(found.base);
  const base = baseWord && (await shard(lang, baseWord)).get(baseWord);
  return {
    title: found.title,
    text: found.text,
    base: base ? found.base : "",
    baseText: base?.text || ""
  };
}

async function lookUpAny(lang, word) {
  const offline =
    OFFLINE.has(lang) && (await lookUpOffline(lang, word).catch(() => null));
  return offline || lookUp(lang, word);
}

// -> Promise<{ word, lang, title, text, base, baseText, url } | { word, lang, missing: true }>
// Rejects when Wiktionary cannot be reached.
export function define(word, lang) {
  const key = `${lang}:${word}`;
  if (!cache.has(key)) {
    const promise = lookUpAny(lang, word).then((entry) => {
      const title = entry?.title || word.toLowerCase();
      const url = `https://${HOSTS[lang]}/wiki/${encodeURIComponent(title)}`;
      return entry
        ? { word, lang, url, ...entry }
        : { word, lang, url, missing: true };
    });
    promise.catch(() => cache.delete(key));
    cache.set(key, promise);
  }
  return cache.get(key);
}
