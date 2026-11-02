// localStorage preferences: language, sound, best score, whether the
// "how to play" pages were seen. Every access tolerates unavailable storage.
const KEYS = {
  lang: "bergamots-lang",
  sound: "fruitmerge-sound",
  best: "fruitmerge-best",
  howto: "fruitmerge-howto-seen"
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
  best: Math.max(0, Number.parseInt(read(KEYS.best, "0"), 10) || 0),
  howtoSeen: read(KEYS.howto, "") === "1"
});

export const saveLang = (lang) => write(KEYS.lang, lang);
export const saveMuted = (muted) => write(KEYS.sound, muted ? "off" : "on");
export const saveBest = (score) => write(KEYS.best, String(score));
export const saveHowtoSeen = () => write(KEYS.howto, "1");
