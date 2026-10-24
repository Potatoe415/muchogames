// DOM HUD (level, lives, area, time, score, best, axis button). Only
// touches the DOM when a value actually changes.
const FIELDS = ["level", "lives", "area", "time", "score", "best"];

export function createHud(root, canvas) {
  const fields = {};
  root.querySelectorAll("[data-hud]").forEach((node) => {
    fields[node.dataset.hud] = node;
  });
  const axisButton = root.querySelector('[data-id="jezzball-axis-button"]');
  const timeStat = root.querySelector('[data-id="jezzball-hud-time"]');
  const last = {};

  function set(key, value) {
    if (last[key] === value) return false;
    last[key] = value;
    return true;
  }

  return {
    axisButton,
    update(view) {
      FIELDS.forEach((key) => {
        if (set(key, view[key])) fields[key].textContent = view[key];
      });
      if (set("urgent", view.urgent)) {
        timeStat.classList.toggle("is-urgent", view.urgent);
      }
      if (set("axis", view.axis)) {
        axisButton.dataset.axis = view.axis;
        canvas.dataset.axis = view.axis;
        axisButton.setAttribute("aria-pressed", String(view.axis === "v"));
      }
    }
  };
}
