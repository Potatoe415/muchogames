// localStorage for settings, the game in progress and win stats per level.
// Everything read back is validated: a bad value falls back to the default.
import { LEVEL_IDS } from "./ai.js";
import { VARIANT_IDS } from "./rules.js";

const SETTINGS_KEY = "checkers-settings";
const SAVED_KEY = "checkers-saved-game";
const STATS_KEY = "checkers-stats";

export const CHOICES = {
  mode: ["solo", "duo"],
  level: LEVEL_IDS,
  color: ["light", "dark", "random"],
  variant: VARIANT_IDS,
  sound: ["on", "off"],
  showMoves: ["on", "off"],
  hints: ["on", "off"],
  theme: ["wood", "classic", "ocean"]
};

const DEFAULTS = {
  mode: "solo",
  level: "medium",
  color: "light",
  variant: "international",
  sound: "on",
  showMoves: "on",
  hints: "off",
  theme: "wood"
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

export function loadSettings() {
  const stored = readJson(SETTINGS_KEY) || {};
  return Object.fromEntries(
    Object.entries(DEFAULTS).map(([name, fallback]) => [
      name,
      CHOICES[name].includes(stored[name]) ? stored[name] : fallback
    ])
  );
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

// { config: { mode, level, variant, side }, moves } — the moves are checked
// against the rules when the game is restored (match.js restoreMatch).
export function loadSaved() {
  const saved = readJson(SAVED_KEY);
  const config = saved?.config;
  if (!config || !Array.isArray(saved.moves)) return null;
  const valid =
    CHOICES.mode.includes(config.mode) &&
    CHOICES.level.includes(config.level) &&
    CHOICES.variant.includes(config.variant) &&
    (config.side === 1 || config.side === -1);
  return valid ? saved : null;
}

export const saveGame = (config, moves) =>
  writeJson(SAVED_KEY, { config, moves });

export const clearGame = () => writeJson(SAVED_KEY, null);
