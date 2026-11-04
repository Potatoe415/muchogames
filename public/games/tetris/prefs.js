// localStorage preferences: language, sound, difficulty, best score. Every
// access tolerates unavailable storage.
import { isDifficulty } from "./difficulty.js";

const KEYS = {
  lang: "bergamots-lang",
  sound: "tetris-sound",
  difficulty: "tetris-difficulty",
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

const readDifficulty = () => {
  const value = read(KEYS.difficulty, "easy");
  return isDifficulty(value) ? value : "easy";
};

export const loadPrefs = () => ({
  lang: read(KEYS.lang, "fr"),
  muted: read(KEYS.sound, "on") === "off",
  difficulty: readDifficulty(),
  best: readInt(KEYS.best, 0, 1e9, 0)
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveDifficulty = (difficulty) => write(KEYS.difficulty, difficulty);
export const saveBest = (score) => write(KEYS.best, String(score));
