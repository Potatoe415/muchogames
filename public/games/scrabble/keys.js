// Keyboard play: letters go to the cursor cell (a blank stands in for a
// missing letter), Backspace takes the last one back, arrows move the cursor,
// Enter plays, Escape recalls the tiles.
const ARROWS = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0]
};

// actions: { active(), typeLetter(L), backspace(), moveCursor(dr, dc),
//            play() -> boolean, recall() }
export function bindKeys(actions) {
  function onKey(event) {
    if (!actions.active() || event.ctrlKey || event.metaKey || event.altKey)
      return;
    const { key } = event;
    if (/^[a-zñ]$/i.test(key)) actions.typeLetter(key.toUpperCase());
    else if (key === "Backspace") actions.backspace();
    else if (ARROWS[key]) actions.moveCursor(...ARROWS[key]);
    else if (key === "Enter") {
      if (!actions.play()) return;
    } else if (key === "Escape") actions.recall();
    else return;
    event.preventDefault();
  }
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}
