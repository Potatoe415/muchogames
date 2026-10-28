// Player-facing copy in FR/EN/ES, one file per language.
import * as en from "./copy-en.js";
import * as es from "./copy-es.js";
import * as fr from "./copy-fr.js";

export const LANGS = ["fr", "en", "es"];

const COPY = { fr, en, es };

export function translate(lang, key, vars = {}) {
  const text = COPY[lang]?.STRINGS[key] ?? fr.STRINGS[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => (COPY[lang] || fr).RULES;
