// Drawing cards: a face, a fanned hand of buttons, a hand as suit lines
// (bridge-diagram style) and the back of a hidden hand.
import { displayOrder, rankOf, sortForDisplay, suitOf } from "./cards.js";
import { cardLabel, rankLabel, SUIT_SYMBOLS } from "./i18n.js";

const RANK_CODES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "j",
  "q",
  "k",
  "a"
];

export const cardCode = (card) =>
  `${"cdhs"[suitOf(card)]}${RANK_CODES[rankOf(card)]}`;

export function cardFace(card, lang, tag = "div") {
  const el = document.createElement(tag);
  const suit = SUIT_SYMBOLS[suitOf(card)];
  el.className = `br-cardface suit-${suitOf(card)}`;
  el.dataset.card = String(card);
  const rank = document.createElement("span");
  rank.className = "br-cardface-rank";
  rank.textContent = rankLabel(lang, rankOf(card));
  const small = document.createElement("span");
  small.className = "br-cardface-suit";
  small.textContent = suit;
  const pip = document.createElement("span");
  pip.className = "br-cardface-pip";
  pip.textContent = suit;
  el.append(rank, small, pip);
  el.setAttribute("aria-label", cardLabel(lang, card));
  return el;
}

// playable: Set of cards the human may play now (null when not their turn).
export function renderFan(
  host,
  cards,
  { lang, trump, playable, hint, onPlay }
) {
  host.replaceChildren();
  host.className = "br-hand br-fan";
  let previous = null;
  sortForDisplay(cards, trump).forEach((card) => {
    const el = cardFace(card, lang, "button");
    el.type = "button";
    el.dataset.id = `bridge-card-${cardCode(card)}`;
    if (previous !== null && suitOf(card) !== previous)
      el.classList.add("is-new-suit");
    previous = suitOf(card);
    const can = Boolean(playable?.has(card));
    el.disabled = !can;
    el.classList.toggle("is-playable", can);
    el.classList.toggle("is-dim", Boolean(playable) && !can);
    el.classList.toggle("is-hint", hint === card);
    if (can) el.addEventListener("click", () => onPlay(card));
    host.append(el);
  });
}

export function renderLines(host, cards, { lang, trump }) {
  host.replaceChildren();
  host.className = "br-hand br-lines";
  displayOrder(trump).forEach((suit) => {
    const row = document.createElement("div");
    row.className = `br-line suit-${suit}`;
    const symbol = document.createElement("span");
    symbol.className = "br-line-suit";
    symbol.textContent = SUIT_SYMBOLS[suit];
    const ranks = document.createElement("span");
    ranks.className = "br-line-cards";
    const held = cards
      .filter((c) => suitOf(c) === suit)
      .sort((a, b) => b - a)
      .map((c) => rankLabel(lang, rankOf(c)));
    ranks.textContent = held.join(" ") || "—";
    row.append(symbol, ranks);
    host.append(row);
  });
}

export function renderBacks(host, count) {
  host.replaceChildren();
  host.className = "br-hand br-backs";
  const shown = Math.min(count, 13);
  for (let i = 0; i < shown; i += 1) {
    const back = document.createElement("span");
    back.className = "br-back";
    host.append(back);
  }
}
