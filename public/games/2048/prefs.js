// localStorage preferences: language, sound, best score. Every access
// tolerates unavailable storage.
const KEYS = {
  lang: "bergamots-lang",
  sound: "2048-sound",
  // The easy record keeps the key from before the levels existed.
  best: { easy: "2048-best", normal: "2048-best-normal" }
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

const readBest = (key) => Math.max(0, Number.parseInt(read(key, "0"), 10) || 0);

export const loadPrefs = () => ({
  lang: read(KEYS.lang, "fr"),
  muted: read(KEYS.sound, "on") === "off",
  best: { easy: readBest(KEYS.best.easy), normal: readBest(KEYS.best.normal) }
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveBest = (level, score) =>
  write(KEYS.best[level], String(score));
