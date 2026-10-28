// The bidding box: a level (1–7), then a strain; Pass, Double, Redouble.
import { bidCall, parseBid } from "./auction.js";
import { strainLabel } from "./i18n.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const STRAIN_IDS = ["clubs", "diamonds", "hearts", "spades", "notrump"];

export function createBidBox(onCall) {
  const levels = $("bridge-bid-levels");
  const strains = $("bridge-bid-strains");
  let legal = new Set();
  let level = 1;
  let hint = null;
  let lastTurn = null;

  for (let n = 1; n <= 7; n += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "br-level";
    button.dataset.level = String(n);
    button.dataset.id = `bridge-bid-level-${n}`;
    button.textContent = String(n);
    button.addEventListener("click", () => {
      level = n;
      refresh();
    });
    levels.append(button);
  }
  STRAIN_IDS.forEach((id, strain) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `br-strain ${strain < 4 ? `suit-${strain}` : "br-nt"}`;
    button.dataset.strain = String(strain);
    button.dataset.id = `bridge-bid-strain-${id}`;
    button.addEventListener("click", () => onCall(bidCall(level, strain)));
    strains.append(button);
  });
  document.querySelectorAll(".br-call").forEach((button) => {
    button.addEventListener("click", () => onCall(button.dataset.call));
  });

  const levelOpen = (n) =>
    [0, 1, 2, 3, 4].some((s) => legal.has(bidCall(n, s)));

  function refresh() {
    levels.querySelectorAll(".br-level").forEach((button) => {
      const n = Number(button.dataset.level);
      button.disabled = !levelOpen(n);
      button.classList.toggle("active", n === level);
      button.classList.toggle("is-hint", parseBid(hint)?.level === n);
    });
    strains.querySelectorAll(".br-strain").forEach((button) => {
      const call = bidCall(level, Number(button.dataset.strain));
      button.disabled = !legal.has(call);
      button.classList.toggle("is-hint", hint === call);
    });
    document.querySelectorAll(".br-call").forEach((button) => {
      button.disabled = !legal.has(button.dataset.call);
      button.classList.toggle("is-hint", hint === button.dataset.call);
    });
  }

  // calls: the legal calls now, or [] to lock the box. A new `turn` starts
  // again from the lowest level still open.
  function update(calls, suggested = null, turn = null) {
    legal = new Set(calls);
    hint = suggested;
    const hinted = parseBid(suggested)?.level;
    if (hinted) level = hinted;
    else if (turn !== lastTurn || !levelOpen(level)) {
      level = [1, 2, 3, 4, 5, 6, 7].find(levelOpen) ?? 7;
    }
    lastTurn = turn;
    refresh();
  }

  function relabel(lang) {
    strains.querySelectorAll(".br-strain").forEach((button) => {
      button.textContent = strainLabel(lang, Number(button.dataset.strain));
    });
  }

  return { update, relabel };
}
