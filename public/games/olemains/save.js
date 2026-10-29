// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Words are stored as indexes into the deck's
// `words`, the deck as its index plus title; everything read back is
// validated against the loaded words.json before use.

const SAVE_KEY = 'olemains-current';
const VERSION = 1;
const MAX_SECONDS = 300;

export function encodeMatch(state, decks) {
  const deckIndex = decks.indexOf(state.currentDeck);
  const position = new Map(state.currentDeck.words.map((word, i) => [word, i]));
  return JSON.stringify({
    v: VERSION,
    deck: deckIndex,
    title: state.currentDeck.title,
    words: state.currentWords.map((word) => position.get(word)),
    current: position.get(state.currentWord),
    score: state.score,
    timeLeft: state.timeLeft
  });
}

function isCount(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validIndexes(data, size) {
  if (!Array.isArray(data.words) || !isCount(data.current, 0, size - 1)) {
    return false;
  }
  const all = [...data.words, data.current];
  return (
    all.every((i) => isCount(i, 0, size - 1)) && new Set(all).size === all.length
  );
}

function validMatch(data, decks) {
  if (!isCount(data.deck, 0, decks.length - 1)) return false;
  const deck = decks[data.deck];
  return (
    data.v === VERSION &&
    deck?.title === data.title &&
    validIndexes(data, deck.words.length) &&
    isCount(data.score, 0, deck.words.length) &&
    isCount(data.timeLeft, 1, MAX_SECONDS)
  );
}

export function decodeMatch(text, decks) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || !validMatch(data, decks)) {
    return null;
  }
  const deck = decks[data.deck];
  return {
    deck,
    currentWords: data.words.map((i) => deck.words[i]),
    currentWord: deck.words[data.current],
    score: data.score,
    timeLeft: data.timeLeft
  };
}

export function loadMatch(decks) {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const match = decodeMatch(text, decks);
    if (!match) localStorage.removeItem(SAVE_KEY);
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(state, decks) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(state, decks));
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
