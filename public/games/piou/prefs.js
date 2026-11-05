// localStorage preferences: language, sound, best score. Every access
// tolerates unavailable storage.
const KEYS = {
  lang: "bergamots-lang",
  sound: "piou-sound",
  best: "piou-best"
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

export function loadPrefs() {
  return {
    lang: read(KEYS.lang, "fr"),
    muted: read(KEYS.sound, "on") === "off",
    best: Math.max(0, Number.parseInt(read(KEYS.best, "0"), 10) || 0)
  };
}

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveBest = (score) => write(KEYS.best, String(score));
