// localStorage: the match in progress, one key per wordpack game, so leaving
// it by any route and coming back resumes it exactly. Everything read back is
// validated before use.
const KEY_PREFIX = "wordplayer-current-";
const VERSION = 1;
const LANGS = ["fr", "en", "es"];
const TIMER_MAX_SECONDS = 300;

const saveKey = (gameId) => `${KEY_PREFIX}${gameId}`;

// Card ids repeat inside some decks (Pictionary, Esquisse), so cards are
// saved by their index in the data file.
export function encodeMatch(state, now = Date.now()) {
  const indexOf = new Map(state.allWords.map((word, index) => [word, index]));
  const startedAt = state.currentCardStartedAtMs;
  return JSON.stringify({
    v: VERSION,
    game: state.currentGameId,
    phase: "playing",
    deckSize: state.allWords.length,
    available: state.availableWords.map((word) => indexOf.get(word)),
    current: indexOf.get(state.currentWord),
    currentId: state.currentWord.id ?? null,
    hidden: state.isCurrentWordHidden,
    defi: state.currentCardIsDefi,
    score: state.score,
    success: state.statsSuccess,
    skipped: state.statsSkipped,
    totalTimeMs: state.statsTotalTimeMs,
    cardElapsedMs: startedAt > 0 ? Math.max(0, now - startedAt) : 0,
    timerDuration: state.timerDuration,
    timerRemaining: state.timerRemaining,
    language: state.currentLanguage
  });
}

const isCount = (value) => Number.isInteger(value) && value >= 0;
const isAmount = (value) => Number.isFinite(value) && value >= 0;
const isIndex = (value, size) => isCount(value) && value < size;

function validMeta(data, gameId) {
  return (
    data?.v === VERSION &&
    data.game === gameId &&
    data.phase === "playing" &&
    LANGS.includes(data.language) &&
    typeof data.hidden === "boolean" &&
    typeof data.defi === "boolean"
  );
}

function validCards(data, allWords) {
  const size = allWords.length;
  const { available, current } = data;
  if (data.deckSize !== size || !Array.isArray(available)) return false;
  if (!isIndex(current, size) || available.includes(current)) return false;
  if ((allWords[current].id ?? null) !== data.currentId) return false;
  const unique = new Set(available).size === available.length;
  return unique && available.every((index) => isIndex(index, size));
}

function validCounters(data) {
  return (
    isAmount(data.score) &&
    isCount(data.success) &&
    isCount(data.skipped) &&
    isAmount(data.totalTimeMs) &&
    isAmount(data.cardElapsedMs)
  );
}

// A running timer at 0 means the match had already ended.
function validTimer(data, timerEnabled) {
  const duration = data.timerDuration;
  if (!isCount(duration) || duration > TIMER_MAX_SECONDS) return false;
  if (!timerEnabled || duration === 0) return isAmount(data.timerRemaining);
  const remaining = data.timerRemaining;
  return Number.isInteger(remaining) && remaining >= 1 && remaining <= duration;
}

export function decodeMatch(text, { gameId, allWords, timerEnabled }) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const valid =
    validMeta(data, gameId) &&
    validCards(data, allWords) &&
    validCounters(data) &&
    validTimer(data, timerEnabled);
  return valid ? data : null;
}

export function applyMatch(state, saved, now = Date.now()) {
  state.availableWords = saved.available.map((index) => state.allWords[index]);
  state.currentWord = state.allWords[saved.current];
  state.isCurrentWordHidden = saved.hidden;
  state.currentCardIsDefi = saved.defi;
  state.score = saved.score;
  state.statsSuccess = saved.success;
  state.statsSkipped = saved.skipped;
  state.statsTotalTimeMs = saved.totalTimeMs;
  state.currentCardStartedAtMs = now - saved.cardElapsedMs;
  state.timerDuration = saved.timerDuration;
  state.timerRemaining = saved.timerRemaining;
  state.currentLanguage = saved.language;
}

export function loadMatch(context) {
  try {
    const text = globalThis.localStorage.getItem(saveKey(context.gameId));
    if (text === null) return null;
    const match = decodeMatch(text, context);
    if (!match) globalThis.localStorage.removeItem(saveKey(context.gameId));
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(state) {
  try {
    globalThis.localStorage.setItem(
      saveKey(state.currentGameId),
      encodeMatch(state)
    );
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch(gameId) {
  try {
    globalThis.localStorage.removeItem(saveKey(gameId));
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
