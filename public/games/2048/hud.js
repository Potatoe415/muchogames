// Score, best and undo button above the board, plus a soft floating "+N"
// after each merge.
export function createHud({ t, $ }) {
  let last = null;

  function float(gained) {
    const chip = document.createElement("span");
    chip.className = "t2-gain";
    chip.textContent = `+${gained}`;
    chip.addEventListener("animationend", () => chip.remove());
    $("2048-score").append(chip);
  }

  function paint() {
    if (!last) return;
    const { state, best } = last;
    $("2048-score-value").textContent = String(state.score);
    $("2048-best-value").textContent = String(Math.max(best, state.score));
    const undo = $("2048-undo-button");
    undo.disabled = !state.canUndo;
    undo.querySelector("[data-count]").textContent = String(state.undos);
    undo.setAttribute("aria-label", t("undoLabel", { n: state.undos }));
    $("2048-paused-undo-button").disabled = !state.canUndo;
  }

  return {
    render(state, best) {
      last = { state, best };
      paint();
      if (state.gained > 0) float(state.gained);
    },
    repaint: paint
  };
}
