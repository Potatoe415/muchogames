// Keyboard, TV remote and on-screen buttons. Left/right repeat with DAS/ARR
// (update(dt) is polled by the game loop); everything else is one-shot.
import { actionOf, ownsKey } from "./keys.js";
import { Repeater, isHorizontal } from "./repeater.js";

function bindKeyboard(on, { press, release, releaseAll }) {
  on(document, "keydown", (event) => {
    const name = actionOf(event);
    if (!name || event.defaultPrevented || event.repeat) return;
    if (event.altKey || event.metaKey) return;
    if (ownsKey(event) && name !== "pause") return;
    event.preventDefault();
    press(name);
  });
  on(document, "keyup", (event) => {
    const name = actionOf(event);
    if (name) release(name);
  });
  on(window, "blur", releaseAll);
}

function bindPad(on, button, { press, release }) {
  const name = button.dataset.pad;
  on(button, "pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    press(name);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    on(button, type, () => release(name))
  );
  // Keyboard / remote activation of a focused pad (no pointer: detail 0).
  on(button, "click", (event) => {
    if (event.detail !== 0) return;
    press(name);
    release(name);
  });
  on(button, "contextmenu", (event) => event.preventDefault());
}

export function createInput({ canPlay, actions }) {
  const repeater = new Repeater(actions.move);
  const life = new AbortController();
  let down = false;

  const api = {
    // Returns the one-shot action's result (rotate: whether it turned).
    press(name) {
      if (name === "pause") return actions.pause();
      if (!canPlay()) return false;
      if (isHorizontal(name)) repeater.press(name);
      else if (name === "down") down = true;
      else return actions[name]?.();
    },
    release(name) {
      if (isHorizontal(name)) repeater.release(name);
      else if (name === "down") down = false;
    },
    releaseAll: () => ["left", "right", "down"].forEach(api.release),
    update: (dt) => canPlay() && repeater.update(dt),
    soft: () => down && canPlay(),
    destroy: () => life.abort(),
    bind(root) {
      const on = (target, type, fn) =>
        target.addEventListener(type, fn, { signal: life.signal });
      bindKeyboard(on, api);
      root.querySelectorAll("[data-pad]").forEach((b) => bindPad(on, b, api));
    }
  };
  return api;
}
