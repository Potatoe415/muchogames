// Player-facing copy in FR/EN/ES (one file per language) and the labels of
// cards, calls, contracts and bid explanations.
import { parseBid } from "./auction.js";
import * as en from "./copy-en.js";
import * as es from "./copy-es.js";
import * as fr from "./copy-fr.js";

export const LANGS = ["fr", "en", "es"];
export const SUIT_SYMBOLS = ["♣", "♦", "♥", "♠"];

const COPY = { fr, en, es };
const copyOf = (lang) => COPY[lang] || fr;

export function translate(lang, key, vars = {}) {
  const text = copyOf(lang).STRINGS[key] ?? fr.STRINGS[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => copyOf(lang).RULES;
export const seatName = (lang, seat) => copyOf(lang).SEATS[seat];
export const seatLetter = (lang, seat) => copyOf(lang).SEAT_LETTERS[seat];
export const rankLabel = (lang, rank) => copyOf(lang).RANKS[rank];

export const cardLabel = (lang, card) =>
  `${rankLabel(lang, card % 13)}${SUIT_SYMBOLS[Math.floor(card / 13)]}`;

export const strainLabel = (lang, strain) =>
  strain === 4 ? copyOf(lang).NT_LABEL : SUIT_SYMBOLS[strain];

export function callLabel(lang, call, short = false) {
  if (call === "P") return translate(lang, "pass");
  if (call === "X") return short ? "X" : translate(lang, "double");
  if (call === "XX") return short ? "XX" : translate(lang, "redouble");
  const bid = parseBid(call);
  return `${bid.level}${strainLabel(lang, bid.strain)}`;
}

export function contractLabel(lang, contract) {
  const doubled = ["", "X", "XX"][contract.doubled];
  return `${contract.level}${strainLabel(lang, contract.strain)}${doubled}`;
}

function hcpText(lang, [min, max]) {
  if (min <= 0 && max >= 37) return null;
  if (max >= 37) return translate(lang, "hcpMin", { min });
  if (min <= 0) return translate(lang, "hcpMax", { max });
  return translate(lang, "hcpRange", { min, max });
}

function lengthText(suit, [min, max]) {
  const symbol = SUIT_SYMBOLS[suit];
  if (min === max) return `${min}${symbol}`;
  if (max >= 13) return min > 0 ? `${min}+${symbol}` : null;
  if (min <= 0) return `≤${max}${symbol}`;
  return `${min}–${max}${symbol}`;
}

// "Stayman · 8+ H · forcing", built from what the call shows.
export function explainText(lang, meta) {
  const tags = copyOf(lang).TAGS;
  const shows = meta?.shows || {};
  const parts = [];
  if (meta?.tag) parts.push(tags[meta.tag] || fr.TAGS[meta.tag] || meta.tag);
  if (shows.hcp) parts.push(hcpText(lang, shows.hcp));
  Object.entries(shows.len || {}).forEach(([suit, range]) => {
    parts.push(lengthText(Number(suit), range));
  });
  if (shows.bal && meta.tag !== "balanced")
    parts.push(translate(lang, "balanced"));
  if (meta?.gf && meta.tag !== "gameForcing" && meta.tag !== "fitGameForcing") {
    parts.push(translate(lang, "gameForcing"));
  } else if (meta?.forcing) parts.push(translate(lang, "forcing"));
  const text = parts.filter(Boolean).join(" · ");
  return text || translate(lang, "noMeaning");
}
