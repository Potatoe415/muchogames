// localStorage for settings, the match in progress and wins per level.
// Everything read back is validated; a bad value falls back to the default.
import { restoreMatch } from "./chicago.js";
import { LEVEL_IDS } from "./play-ai.js";

const SETTINGS_KEY = "bridge-settings";
const SAVED_KEY = "bridge-saved-match";
const STATS_KEY = "bridge-stats";

export const CHOICES = {
  level: LEVEL_IDS,
  sound: ["on", "off"],
  speed: ["slow", "normal", "fast"],
  hints: ["on", "off"],
  autoplay: ["on", "off"],
  deck: ["two", "four"],
  openHands: ["off", "on"]
};

const DEFAULTS = {
  level: "medium",
  sound: "on",
  speed: "normal",
  hints: "off",
  autoplay: "on",
  deck: "two",
  openHands: "off"
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

const PANELS = ["hands", "score"];

const cleanView = (view) => ({
  auction: view?.auction === true,
  panels: PANELS.filter(
    (panel) => Array.isArray(view?.panels) && view.panels.includes(panel)
  )
});

function restoreSaved(saved) {
  try {
    return LEVEL_IDS.includes(saved.level) ? restoreMatch(saved) : null;
  } catch {
    return null;
  }
}

// The match is replayed against the rules when it is read back; a save that
// does not replay is dropped.
export function loadSaved() {
  if (readText(SAVED_KEY, null) === null) return null;
  const saved = readJson(SAVED_KEY);
  const match = saved && restoreSaved(saved);
  if (match) return { match, view: cleanView(saved.view) };
  clearMatch();
  return null;
}

export const saveMatch = (match, view) =>
  writeJson(SAVED_KEY, {
    level: match.level,
    deals: match.deals,
    view: cleanView(view)
  });

export const clearMatch = () => writeJson(SAVED_KEY, null);
