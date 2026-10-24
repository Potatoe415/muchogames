// DOM HUD (score, level, quota left, countdown, >> button). Only touches
// the DOM when a value actually changes.
export function createHud(root) {
  const fields = {};
  root.querySelectorAll("[data-hud]").forEach((node) => {
    fields[node.dataset.hud] = node;
  });
  const fastButton = root.querySelector('[data-id="pipedream-fast-button"]');
  const countdownStat = root.querySelector(
    '[data-id="pipedream-hud-countdown"]'
  );
  const last = {};

  function set(key, value) {
    if (last[key] === value) return false;
    last[key] = value;
    return true;
  }

  return {
    fastButton,
    update(view) {
      ["score", "level", "quota", "countdown"].forEach((key) => {
        if (set(key, view[key])) fields[key].textContent = view[key];
      });
      if (set("urgent", view.urgent)) {
        countdownStat.classList.toggle("is-urgent", view.urgent);
      }
      if (set("fast", view.fast)) {
        fastButton.setAttribute("aria-pressed", String(view.fast));
      }
      if (set("fastEnabled", view.fastEnabled)) {
        fastButton.disabled = !view.fastEnabled;
      }
    }
  };
}
