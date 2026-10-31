import { LANGS } from "./i18n.js";

const LANG_KEY = "bergamots-lang";
const MUTE_KEY = "muchogames_memory_mute";

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable.
  }
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readLang() {
  const value = read(LANG_KEY);
  return LANGS.includes(value) ? value : "fr";
}

export const storeLang = (lang) => store(LANG_KEY, lang);

export const readMuted = () => read(MUTE_KEY) === "1";

export const storeMuted = (muted) => store(MUTE_KEY, muted ? "1" : "0");
