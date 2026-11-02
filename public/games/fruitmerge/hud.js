// The DOM around the board: score, next three fruits, broom and undo
// buttons with their counts, danger warning, and the fruit order bar.
import { FRUITS } from "./fruits.js";
import { paintIcon } from "./sprites.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function setTool(id, count, enabled, label) {
  const button = $(id);
  button.disabled = !enabled;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.querySelector("[data-count]").textContent = String(count);
}

export function createHud({ t, fruitName }) {
  let last = null;

  function paintNext(next, force) {
    next.forEach((level, i) => {
      const canvas = $(`fruitmerge-next-${i + 1}`);
      if (!force && canvas.dataset.level === String(level)) return;
      canvas.dataset.level = String(level);
      canvas.setAttribute("aria-label", fruitName(level));
      paintIcon(canvas, level);
    });
  }

  function render(hud, force = false) {
    last = hud;
    $("fruitmerge-score-value").textContent = String(hud.score);
    paintNext(hud.next, force);
    const sweep = t("sweepLabel", { n: hud.sweeps });
    const undo = t("undoLabel", { n: hud.undos });
    setTool("fruitmerge-sweep-button", hud.sweeps, hud.canSweep, sweep);
    setTool("fruitmerge-undo-button", hud.undos, hud.canUndo, undo);
    $("fruitmerge-danger").hidden = !hud.danger;
  }

  function paintEvolution() {
    const bar = $("fruitmerge-evolution");
    if (bar.children.length !== FRUITS.length) {
      bar.replaceChildren(
        ...FRUITS.map(() => document.createElement("canvas"))
      );
    }
    [...bar.children].forEach((canvas, level) => {
      canvas.className = "fm-evolution-fruit";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", fruitName(level));
      canvas.title = fruitName(level);
      paintIcon(canvas, level);
    });
  }

  return {
    render,
    // After a resize or a language change.
    repaint() {
      paintEvolution();
      if (last) render(last, true);
    }
  };
}
