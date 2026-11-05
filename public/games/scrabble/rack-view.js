// The rack of the player whose turn it is. A tile put on the board leaves an
// empty slot behind; between two players on one device the tiles are face down.
import { tileHtml } from "./board-view.js";
import { isPlaced } from "./draft.js";
import { RACK_SIZE } from "./tiles.js";

function slotButton(letter, k, { selected, hidden }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sc-slot";
  button.dataset.slot = String(k);
  button.dataset.id = `scrabble-rack-tile-${k + 1}`;
  button.classList.toggle("is-selected", selected === k);
  button.innerHTML = hidden
    ? '<span class="sc-tile is-back"></span>'
    : tileHtml(letter);
  button.setAttribute("aria-pressed", String(selected === k));
  button.disabled = hidden;
  button.dataset.tvFocus = "";
  return button;
}

function emptySlot(k) {
  const span = document.createElement("span");
  span.className = "sc-slot is-empty";
  span.dataset.slot = String(k);
  return span;
}

export function createRackView(host) {
  let key = "";
  host.style.setProperty("--rack", String(RACK_SIZE));

  // { rack, draft, selected, hidden }
  function paint(state) {
    const { rack, draft, selected, hidden } = state;
    const next = JSON.stringify([
      rack,
      draft.map((d) => d.k),
      selected,
      hidden
    ]);
    if (next === key) return;
    key = next;
    host.replaceChildren(
      ...rack.map((letter, k) =>
        isPlaced(draft, k) ? emptySlot(k) : slotButton(letter, k, state)
      )
    );
  }

  // The tile in slot k, or the first one left: true when one took the focus.
  function focusSlot(k) {
    const button =
      host.querySelector(`button[data-slot="${k}"]:not(:disabled)`) ||
      host.querySelector("button:not(:disabled)");
    button?.focus({ preventScroll: true });
    return Boolean(button);
  }

  return { paint, focusSlot };
}
