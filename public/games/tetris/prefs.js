// localStorage preferences: language, sound, start level, ghost piece, best
// score. Every access tolerates unavailable storage.
import { MAX_START_LEVEL } from "./scoring.js";

const KEYS = {
  lang: "bergamots-lang",
  sound: "tetris-sound",
  level: "tetris-start-level",
  ghost: "tetris-ghost",
  best: "tetris-best"
};

function read(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the setting only lasts for this visit.
  }
}

const readInt = (key, min, max, fallback) => {
  const n = Number.parseInt(read(key, String(fallback)), 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

export const loadPrefs = () => ({
  lang: read(KEYS.lang, "fr"),
  muted: read(KEYS.sound, "on") === "off",
  startLevel: readInt(KEYS.level, 0, MAX_START_LEVEL, 0),
  ghost: read(KEYS.ghost, "off") === "on",
  best: readInt(KEYS.best, 0, 1e9, 0)
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveStartLevel = (level) => write(KEYS.level, String(level));
export const saveGhost = (ghost) => write(KEYS.ghost, ghost ? "on" : "off");
export const saveBest = (score) => write(KEYS.best, String(score));
