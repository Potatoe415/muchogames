// In-game sheets: blank letter picker, swap-or-pass, letters left, and the
// "pass the device" screen between two players. Each open() returns a promise
// of the choice (null when dismissed by the backdrop, Cancel or Escape).
import { tileHtml } from "./board-view.js";
import { renderDefinitions } from "./define-view.js";
import { LETTERS } from "./tiles.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function createDialogs() {
  let current = null;

  function open(id, { dismissable = true } = {}) {
    current?.resolve(null);
    const el = $(id);
    el.hidden = false;
    return new Promise((resolve) => {
      current = {
        el,
        dismissable,
        resolve: (value) => close(el, resolve, value)
      };
      el.querySelector("button:not([disabled])")?.focus({
        preventScroll: true
      });
    });
  }

  function close(el, resolve, value) {
    el.hidden = true;
    current = null;
    resolve(value);
  }

  const answer = (value) => current?.resolve(value);
  const dismiss = () => current?.dismissable && answer(null);

  function pickBlank() {
    const host = $("scrabble-blank-letters");
    host.replaceChildren(
      ...[...LETTERS].map((letter) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sc-pick";
        const name = letter === "Ñ" ? "enye" : letter.toLowerCase();
        b.dataset.id = `scrabble-blank-letter-${name}`;
        b.textContent = letter;
        b.addEventListener("click", () => answer(letter));
        return b;
      })
    );
    return open("scrabble-blank-dialog");
  }

  function renderSwap(rack, chosen, allowed, t) {
    $("scrabble-swap-tiles").replaceChildren(
      ...rack.map((letter, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sc-slot";
        b.dataset.id = `scrabble-swap-tile-${k + 1}`;
        b.disabled = !allowed;
        b.classList.toggle("is-selected", chosen.has(k));
        b.setAttribute("aria-pressed", String(chosen.has(k)));
        b.innerHTML = tileHtml(letter);
        b.addEventListener("click", () => {
          chosen.has(k) ? chosen.delete(k) : chosen.add(k);
          renderSwap(rack, chosen, allowed, t);
        });
        return b;
      })
    );
    const confirm = $("scrabble-swap-confirm");
    confirm.disabled = !allowed || !chosen.size;
    confirm.textContent = t("swapConfirm", { count: chosen.size });
  }

  // -> { kind: "swap", letters } | { kind: "pass" } | null
  function swapOrPass(rack, allowed, t) {
    const chosen = new Set();
    $("scrabble-swap-note").textContent = t(allowed ? "swapHelp" : "swapNone");
    renderSwap(rack, chosen, allowed, t);
    const done = open("scrabble-swap-dialog");
    $("scrabble-swap-confirm").onclick = () =>
      answer({ kind: "swap", letters: [...chosen].map((k) => rack[k]) });
    $("scrabble-pass-confirm").onclick = () => answer({ kind: "pass" });
    return done;
  }

  function showBag(unseen, bagCount, t) {
    $("scrabble-bag-summary").textContent = t("bagSummary", {
      bag: bagCount,
      unseen: unseen.length
    });
    const counts = new Map();
    unseen.forEach((l) => counts.set(l, (counts.get(l) || 0) + 1));
    $("scrabble-bag-letters").replaceChildren(
      ...[...counts].map(([letter, n]) => {
        const item = document.createElement("span");
        item.className = "sc-bag-item";
        item.innerHTML = `${tileHtml(letter)}<em>×${n}</em>`;
        return item;
      })
    );
    return open("scrabble-bag-dialog");
  }

  function showDefinitions(items, t, showLang) {
    renderDefinitions($("scrabble-define-body"), items, t, showLang);
    return open("scrabble-define-dialog");
  }

  function handoff(title, line) {
    $("scrabble-handoff-title").textContent = title;
    $("scrabble-handoff-line").textContent = line;
    return open("scrabble-handoff", { dismissable: false });
  }

  function bind() {
    document
      .querySelectorAll("[data-sheet-close]")
      .forEach((node) => node.addEventListener("click", dismiss));
    $("scrabble-handoff-button").addEventListener("click", () => answer(true));
    document.addEventListener("keydown", (event) => {
      const picking = current?.el === $("scrabble-blank-dialog");
      const typed = event.key.length === 1 ? event.key.toUpperCase() : "";
      if (picking && typed && LETTERS.includes(typed)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        answer(typed);
      } else if (event.key === "Escape" && current?.dismissable) {
        event.preventDefault();
        event.stopImmediatePropagation();
        dismiss();
      }
    });
  }

  bind();
  return {
    pickBlank,
    swapOrPass,
    showBag,
    showDefinitions,
    handoff,
    isOpen: () => Boolean(current),
    closeAll: () => current?.resolve(null)
  };
}
