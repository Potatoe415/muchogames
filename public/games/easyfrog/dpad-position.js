// Where the on-screen arrows sit (Options → "Position des flèches"): left
// or right for one-thumb play, or centred. stage.css reads the D-pad's
// data-position; the choice is kept in the game settings.
import { DPAD_POSITIONS } from "./prefs.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function apply(position) {
  $("easyfrog-dpad").dataset.position = position;
  document.querySelectorAll("[data-dpad-position]").forEach((button) => {
    const chosen = button.dataset.dpadPosition === position;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
}

// `settings` is the shared settings object; `save(settings)` stores it.
export function initDpadPosition(settings, save) {
  document.querySelectorAll("[data-dpad-position]").forEach((button) => {
    button.addEventListener("click", () => {
      const position = button.dataset.dpadPosition;
      if (!DPAD_POSITIONS.includes(position)) return;
      settings.dpadPosition = position;
      save(settings);
      apply(position);
    });
  });
  apply(settings.dpadPosition);
}
