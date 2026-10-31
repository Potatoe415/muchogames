// localStorage preferences: language, sound, last theme and mode, best score
// per mode. Every access tolerates unavailable storage.
import { MODE_IDS } from "./rules.js";
import { THEME_IDS } from "./themes.js";

const KEYS = {
  lang: "bergamots-lang",
  sound: "fruitslash-sound",
  theme: "fruitslash-theme",
  mode: "fruitslash-mode"
};
const bestKey = (mode) => `fruitslash-best-${mode}`;

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

const oneOf = (list, value) => (list.includes(value) ? value : list[0]);

export const loadPrefs = () => ({
  lang: read(KEYS.lang, "fr"),
  muted: read(KEYS.sound, "on") === "off",
  theme: oneOf(THEME_IDS, read(KEYS.theme, THEME_IDS[0])),
  mode: oneOf(MODE_IDS, read(KEYS.mode, MODE_IDS[0])),
  best: Object.fromEntries(
    MODE_IDS.map((mode) => [mode, Number(read(bestKey(mode), "0")) || 0])
  )
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveTheme = (theme) => write(KEYS.theme, theme);
export const saveMode = (mode) => write(KEYS.mode, mode);
export const saveBest = (mode, score) => write(bestKey(mode), String(score));
