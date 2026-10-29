// localStorage preferences: settings, last difficulty, best score per
// difficulty, whether the easy-mode help was seen. Every access tolerates
// unavailable storage.
import { DIFFICULTIES, normalizeDifficulty } from "./levels.js";

const KEYS = {
  lang: "bergamots-lang",
  sound: "jezzball-sound",
  swipe: "jezzball-swipe",
  difficulty: "jezzball-difficulty",
  intro: "jezzball-intro-seen"
};
const BEST_KEYS = {
  normal: "jezzball-best-score",
  easy: "jezzball-best-score-easy"
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

export const loadPrefs = () => ({
  lang: read(KEYS.lang, "fr"),
  muted: read(KEYS.sound, "on") === "off",
  swipe: read(KEYS.swipe, "on") === "on",
  difficulty: normalizeDifficulty(read(KEYS.difficulty, "normal")),
  introSeen: read(KEYS.intro, "") === "1",
  best: Object.fromEntries(
    DIFFICULTIES.map((d) => [d, Number(read(BEST_KEYS[d], "0")) || 0])
  )
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveSwipe = (swipe) => write(KEYS.swipe, swipe ? "on" : "off");
export const saveDifficulty = (value) => write(KEYS.difficulty, value);
export const saveIntroSeen = () => write(KEYS.intro, "1");
export const saveBest = (difficulty, score) =>
  write(BEST_KEYS[difficulty], String(score));
