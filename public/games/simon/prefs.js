// localStorage preferences: language, sound, last difficulty, best score
// per difficulty. Every access tolerates unavailable storage.
import { isDifficulty } from "./rules.js";

const KEYS = {
  lang: "bergamots-lang",
  sound: "simon-sound",
  difficulty: "simon-difficulty"
};
// Normal keeps the key it had before the Easy level existed.
const BEST_KEYS = { normal: "simon-best", easy: "simon-best-easy" };

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

const readBest = (key) =>
  Math.max(0, Number.parseInt(read(key, "0"), 10) || 0);

export function loadPrefs() {
  const difficulty = read(KEYS.difficulty, "normal");
  return {
    lang: read(KEYS.lang, "fr"),
    muted: read(KEYS.sound, "on") === "off",
    difficulty: isDifficulty(difficulty) ? difficulty : "normal",
    best: { normal: readBest(BEST_KEYS.normal), easy: readBest(BEST_KEYS.easy) }
  };
}

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveDifficulty = (difficulty) =>
  write(KEYS.difficulty, difficulty);
export const saveBest = (difficulty, score) =>
  write(BEST_KEYS[difficulty], String(score));
