// localStorage for settings, the match in progress and wins per level.
// Everything read back is validated: a bad value falls back to the default.
import { LEVEL_IDS } from "./ai.js";
import { WORD_LANGS } from "./tiles.js";

const SETTINGS_KEY = "scrabble-settings-v2";
const SAVED_KEY = "scrabble-saved-game";
const STATS_KEY = "scrabble-stats";
const NAME_MAX = 16;

// players: 1 = you against the computer, 2–4 = people on one device.
export const PLAYER_COUNTS = [1, 2, 3, 4];
export const NAME_SLOTS = 4;

export const CHOICES = {
  players: PLAYER_COUNTS,
  level: LEVEL_IDS,
  sound: ["on", "off"],
  hints: ["on", "off"]
};

const DEFAULTS = {
  players: 1,
  level: "medium",
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

const cleanNames = (names) =>
  Array.from({ length: NAME_SLOTS }, (_, p) =>
    cleanName(Array.isArray(names) ? names[p] : "")
  );

// Word languages: one or more of WORD_LANGS, in that order. Older values were
// one string ("fr", "en", "es" or "fr-es").
function cleanWords(raw) {
  const list = typeof raw === "string" ? raw.split("-") : raw;
  if (!Array.isArray(list)) return [];
  return WORD_LANGS.filter((lang) => list.includes(lang));
}

// Ticks a word language on or off; the last one stays on.
export function toggleWord(words, lang) {
  const next = words.includes(lang)
    ? words.filter((l) => l !== lang)
    : [...words, lang];
  return next.length ? cleanWords(next) : words;
}

// Older settings and saves had mode "solo" (1 player) or "duo" (2).
const playersOf = (stored) =>
  PLAYER_COUNTS.includes(stored.players)
    ? stored.players
    : stored.mode === "duo"
      ? 2
      : stored.mode === "solo"
        ? 1
        : null;

// The word language defaults to the interface language on a first visit.
export function loadSettings(uiLang) {
  const stored = readJson(SETTINGS_KEY) || {};
  const settings = Object.fromEntries(
    Object.entries(DEFAULTS).map(([name, fallback]) => [
      name,
      CHOICES[name].includes(stored[name]) ? stored[name] : fallback
    ])
  );
  settings.players = playersOf(stored) ?? DEFAULTS.players;
  const words = cleanWords(stored.words);
  settings.words = words.length
    ? words
    : [WORD_LANGS.includes(uiLang) ? uiLang : "fr"];
  settings.names = cleanNames(stored.names);
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

// Solo personal best, one key per level (docs/PLATFORM_RULES.md 4.3).
const bestKey = (level) => `muchogames_scrabble_best_${level}`;

export function loadBest(level) {
  const n = Math.floor(Number(readText(bestKey(level), "0")));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const saveBest = (level, score) =>
  writeText(bestKey(level), String(score));

// { config: { players, level, words, names }, game, draft, hintsUsed } — game
// and draft are checked by game.js restoreGame and draft.js draftFits;
// hintsUsed = hints taken this turn (any = the move scores 0). Saves from
// before the word-language choice are French.
export function loadSaved() {
  const saved = readJson(SAVED_KEY);
  const raw = saved?.config;
  if (!raw || !saved.game) return null;
  const config = {
    players: playersOf(raw),
    level: raw.level,
    words: cleanWords(raw.words ?? "fr"),
    names: cleanNames(raw.names)
  };
  const valid =
    config.players !== null &&
    CHOICES.level.includes(config.level) &&
    config.words.length > 0;
  return valid ? { ...saved, config } : null;
}

// turn: { draft, hintsUsed } from play.js snapshot().
export const saveGame = (config, game, turn) =>
  writeJson(SAVED_KEY, { config, game, ...turn });

// A missing or damaged count (older saves) = no hint used.
export const hintsUsedOf = (n) => (Number.isInteger(n) && n > 0 ? n : 0);

export const clearGame = () => writeJson(SAVED_KEY, null);
