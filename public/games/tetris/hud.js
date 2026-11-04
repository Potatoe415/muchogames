// Score, lines, level, best and the short "Tetris!" style toast.
import { levelFor } from "./scoring.js";

export function createHud({ $ }) {
  let last = null;

  function paint(state, best) {
    $("tetris-score-value").textContent = String(state.score);
    $("tetris-lines-value").textContent = String(state.lines);
    $("tetris-level-value").textContent = String(
      levelFor(state.startLevel, state.lines)
    );
    $("tetris-best-value").textContent = String(Math.max(best, state.score));
  }

  return {
    render(state, best) {
      last = { state, best };
      paint(state, best);
    },
    // Re-translate labels after a language change.
    repaint() {
      if (last) paint(last.state, last.best);
    },
    toast(text) {
      const node = $("tetris-toast");
      node.textContent = text;
      node.classList.remove("show");
      void node.offsetWidth;
      node.classList.add("show");
    }
  };
}
