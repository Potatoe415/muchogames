// The four pad buttons: lighting them, and the player's presses from touch,
// mouse (pointerdown, for no delay), keyboard (Enter / Space on a focused
// pad, digits 1-4) and the TV remote (OK = Enter click). The arrows move the
// focus between pads; on a TV, tv-remote.js does it first.
const DIGITS = { 1: 0, 2: 1, 3: 2, 4: 3 };
// Pads in reading order: 0 green, 1 red (top), 2 yellow, 3 blue (bottom).
const NEIGHBOURS = {
  ArrowLeft: [0, 0, 2, 2],
  ArrowRight: [1, 1, 3, 3],
  ArrowUp: [0, 1, 0, 1],
  ArrowDown: [2, 3, 2, 3]
};
const TYPING = "input, textarea, select";

export function createBoard({ board, onPress }) {
  const pads = [...board.querySelectorAll("[data-pad]")];
  const timers = new Map();

  function light(index, ms) {
    const pad = pads[index];
    clearTimeout(timers.get(index));
    pad.classList.add("is-lit");
    timers.set(
      index,
      setTimeout(() => pad.classList.remove("is-lit"), ms)
    );
  }

  function darken() {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    pads.forEach((pad) => pad.classList.remove("is-lit"));
  }

  function onPointer(event) {
    if (event.button > 0) return;
    const pad = event.target.closest("[data-pad]");
    if (pad) onPress(Number(pad.dataset.pad));
  }

  // Pointer presses are handled on pointerdown; a click with detail 0 comes
  // from Enter / Space / the remote's OK.
  function onClick(event) {
    const pad = event.target.closest("[data-pad]");
    if (pad && event.detail === 0) onPress(Number(pad.dataset.pad));
  }

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey) return;
    if (event.metaKey || event.target.closest?.(TYPING)) return;
    if (board.closest("[hidden]")) return;
    if (event.key in DIGITS) {
      event.preventDefault();
      return onPress(DIGITS[event.key]);
    }
    const current = pads.indexOf(document.activeElement);
    const targets = NEIGHBOURS[event.key];
    if (!targets || current < 0) return;
    event.preventDefault();
    pads[targets[current]].focus();
  }

  board.addEventListener("pointerdown", onPointer);
  board.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);

  return {
    light,
    darken,
    setWaiting(waiting) {
      board.classList.toggle("is-waiting", waiting);
    },
    destroy() {
      darken();
      board.classList.remove("is-waiting");
      board.removeEventListener("pointerdown", onPointer);
      board.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    }
  };
}
