// Keyboard play: letters go to the cursor cell (a blank stands in for a
// missing letter), Backspace takes the last one back, arrows move the cursor,
// Enter plays, Escape recalls the tiles. On a TV (tv-remote.js) the arrows
// move the cursor only while a board cell has the focus (data-tv-keys), and
// OK / Back stay the remote's: OK presses the focused control.
import { SIZE } from "./tiles.js";

const ARROWS = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0]
};

// On a TV, OK presses the focused control (tile, square, Play button).
const playsOnEnter = () => !window.MuchogamesTv?.isOn();

const focusedCell = () => {
  const cell = document.activeElement?.closest?.("[data-cell]");
  return cell ? Number(cell.dataset.cell) : undefined;
};

// Not your turn (computer thinking, match over, Define): the arrows still
// walk the board cells, so a word can be looked up from the remote.
function walkBoard(event, from) {
  const [dr, dc] = ARROWS[event.key];
  const r = Math.floor(from / SIZE) + dr;
  const c = (from % SIZE) + dc;
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return;
  const cell = document.querySelector(`[data-cell="${r * SIZE + c}"]`);
  cell?.focus({ preventScroll: true });
  event.preventDefault();
}

// actions: { active(), typeLetter(L), backspace(), moveCursor(dr, dc, from),
//            play() -> boolean, recall() }
export function bindKeys(actions) {
  function onKey(event) {
    if (event.defaultPrevented) return;
    const from = focusedCell();
    if (!actions.active()) {
      if (ARROWS[event.key] && from !== undefined) walkBoard(event, from);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { key } = event;
    if (/^[a-zñ]$/i.test(key)) actions.typeLetter(key.toUpperCase());
    else if (key === "Backspace") actions.backspace();
    else if (ARROWS[key]) actions.moveCursor(...ARROWS[key], from);
    else if (key === "Enter") {
      if (!playsOnEnter() || !actions.play()) return;
    } else if (key === "Escape") actions.recall();
    else return;
    event.preventDefault();
  }
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}
