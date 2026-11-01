// localStorage for settings, the match in progress and wins per level.
// Everything read back is validated: a bad value falls back to the default.
import { LEVEL_IDS } from "./ai.js";
import { WORD_LANGS } from "./tiles.js";

const SETTINGS_KEY = "scrabble-settings-v2";
const SAVED_KEY = "scrabble-saved-game";
const STATS_KEY = "scrabble-stats";
const NAME_MAX = 16;

export const CHOICES = {
  mode: ["solo", "duo"],
  level: LEVEL_IDS,
  words: WORD_LANGS,
  p1Lang: ["fr", "es"],
  sound: ["on", "off"],
  hints: ["on", "off"]
};

const DEFAULTS = {
  mode: "solo",
  level: "medium",
  words: "fr",
  p1Lang: "fr",
  sound: "on",
  hints: "off"
};

export function readText(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeText(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the value only lasts for this visit.
  }
}

function readJson(key) {
  try {
    return JSON.parse(readText(key, "null"));
  } catch {
    return null;
  }
}

const writeJson = (key, value) =>
  writeText(key, value === null ? null : JSON.stringify(value));

export const cleanName = (name) =>
  typeof name === "string" ? name.trim().slice(0, NAME_MAX) : "";

// The word language defaults to the interface language on a first visit.
export function loadSettings(uiLang) {
  const stored = readJson(SETTINGS_KEY) || {};
  const defaults = {
    ...DEFAULTS,
    words: WORD_LANGS.includes(uiLang) ? uiLang : "fr"
  };
  const settings = Object.fromEntries(
    Object.entries(defaults).map(([name, fallback]) => [
      name,
      CHOICES[name].includes(stored[name]) ? stored[name] : fallback
    ])
  );
  const names = Array.isArray(stored.names) ? stored.names : [];
  settings.names = [cleanName(names[0]), cleanName(names[1])];
  return settings;
}

export const saveSettings = (settings) => writeJson(SETTINGS_KEY, settings);

export function loadStats() {
  const stored = readJson(STATS_KEY) || {};
  return Object.fromEntries(
    LEVEL_IDS.map((id) => {
      const won = Math.max(0, Math.floor(Number(stored[id]?.won) || 0));
      const played = Math.max(won, Math.floor(Number(stored[id]?.played) || 0));
      return [id, { won, played }];
    })
  );
}

export const saveStats = (stats) => writeJson(STATS_KEY, stats);

// { config: { mode, level, words, p1Lang, names }, game, draft } — game and
// draft are checked by game.js restoreGame and draft.js draftFits. Saves
// from before the word-language choice are French.
export function loadSaved() {
  const saved = readJson(SAVED_KEY);
  const config = saved?.config;
  if (!config || !saved.game) return null;
  config.words ??= "fr";
  config.p1Lang ??= "fr";
  const valid =
    CHOICES.words.includes(config.words) &&
    CHOICES.p1Lang.includes(config.p1Lang) &&
    CHOICES.mode.includes(config.mode) &&
    CHOICES.level.includes(config.level) &&
    Array.isArray(config.names) &&
    config.names.length === 2;
  if (!valid) return null;
  config.names = config.names.map(cleanName);
  return saved;
}

export const saveGame = (config, game, draft) =>
  writeJson(SAVED_KEY, { config, game, draft });

export const clearGame = () => writeJson(SAVED_KEY, null);
