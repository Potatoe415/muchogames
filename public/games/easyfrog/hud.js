// The in-match HUD: score, level, timer (Normal only), lives, god mode.
// Called every frame; the DOM is only touched when something changed.
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function createHud(formatNumber) {
  let last = "";
  return {
    reset() {
      last = "";
    },
    render({ score, level, lives, timeLeft, godMode }) {
      const time = timeLeft === null ? "" : Math.max(0, timeLeft).toFixed(1);
      const text = [score, level, lives, time, godMode].join("|");
      if (text === last) return;
      last = text;
      $("easyfrog-score").textContent = formatNumber(score);
      $("easyfrog-level").textContent = String(level);
      $("easyfrog-lives").textContent = "♥".repeat(Math.max(0, lives));
      const timer = $("easyfrog-timer-row");
      timer.hidden = timeLeft === null;
      timer.classList.toggle("ef-urgent", timeLeft !== null && timeLeft <= 5);
      $("easyfrog-timer").textContent = time;
      $("easyfrog-godmode").hidden = !godMode;
    }
  };
}
