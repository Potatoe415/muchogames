// localStorage for settings, the game in progress and results per level.
// Everything read back is validated: a bad value falls back to the default.
import { LEVEL_IDS } from "./ai.js";
import { CLOCK_IDS, clockMinutes } from "./clock.js";

const SETTINGS_KEY = "chess-settings";
const SAVED_KEY = "chess-saved-game";
const STATS_KEY = "chess-stats";

export const CHOICES = {
  mode: ["solo", "duo"],
  level: LEVEL_IDS,
  color: ["white", "black", "random"],
  clock: CLOCK_IDS,
  sound: ["on", "off"],
  showMoves: ["on", "off"],
  hints: ["on", "off"],
  theme: ["wood", "classic", "ocean"]
};

const DEFAULTS = {
  mode: "solo",
  level: "medium",
  color: "white",
  clock: "none",
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

const count = (value) => Math.max(0, Math.floor(Number(value) || 0));

export function loadStats() {
  const stored = readJson(STATS_KEY) || {};
  return Object.fromEntries(
    LEVEL_IDS.map((id) => {
      const won = count(stored[id]?.won);
      const drawn = count(stored[id]?.drawn);
      const played = Math.max(won + drawn, count(stored[id]?.played));
      return [id, { won, drawn, played }];
    })
  );
}

export const saveStats = (stats) => writeJson(STATS_KEY, stats);

const timeLeft = (value, minutes) =>
  Number.isFinite(value) && value >= 0 && value <= minutes * 60000;

// A save from before the clock existed has none: it plays untimed.
function validClock(config, clock) {
  config.clock ??= "none";
  if (!CHOICES.clock.includes(config.clock)) return false;
  const minutes = clockMinutes(config.clock);
  return (
    !minutes ||
    (timeLeft(clock?.white, minutes) && timeLeft(clock?.black, minutes))
  );
}

// { config: { mode, level, side, clock }, moves, clock: { white, black } } —
// the moves are checked against the rules when the game is restored
// (match.js restoreMatch).
export function loadSaved() {
  const saved = readJson(SAVED_KEY);
  const config = saved?.config;
  if (!config || !Array.isArray(saved.moves)) return null;
  const valid =
    CHOICES.mode.includes(config.mode) &&
    CHOICES.level.includes(config.level) &&
    (config.side === 1 || config.side === -1) &&
    validClock(config, saved.clock);
  return valid ? saved : null;
}

export const saveGame = (config, moves, clock = null) =>
  writeJson(SAVED_KEY, { config, moves, clock });

export const clearGame = () => writeJson(SAVED_KEY, null);
