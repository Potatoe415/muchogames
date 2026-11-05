// Player preferences and records: language (shared by every game), the
// display / sound settings, and the best score per difficulty.
const LANG_KEY = "bergamots-lang";
const SETTINGS_KEY = "muchogames_easyfrog_settings";
const BEST_KEYS = {
  normal: "muchogames_easyfrog_best",
  easy: "muchogames_easyfrog_best_easy"
};

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  animationEnabled: true,
  objectsMovementEnabled: true
};

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
}

export const loadLang = () => read(LANG_KEY);
export const saveLang = (lang) => write(LANG_KEY, lang);

// Unknown or non-boolean fields fall back to the defaults.
export function loadSettings() {
  let saved = null;
  try {
    saved = JSON.parse(read(SETTINGS_KEY));
  } catch {
    saved = null;
  }
  const settings = { ...DEFAULT_SETTINGS };
  Object.keys(settings).forEach((key) => {
    if (typeof saved?.[key] === "boolean") settings[key] = saved[key];
  });
  return settings;
}

export const saveSettings = (settings) =>
  write(SETTINGS_KEY, JSON.stringify(settings));

export function loadBest(difficulty) {
  const best = Number(read(BEST_KEYS[difficulty]));
  return Number.isInteger(best) && best > 0 ? best : 0;
}

// Returns true when `score` is a new record.
export function storeBest(difficulty, score) {
  if (score <= loadBest(difficulty)) return false;
  write(BEST_KEYS[difficulty], String(score));
  return true;
}
