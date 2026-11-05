// Controls of a match: arrow keys / WASD (and the TV remote's arrows on
// the focused board), swipes on the board, the on-screen D-pad, Escape or
// P to pause, F8 / F9 for the owner's test cheats.
const KEYS = {
  ArrowUp: "UP",
  Up: "UP",
  w: "UP",
  W: "UP",
  ArrowDown: "DOWN",
  Down: "DOWN",
  s: "DOWN",
  S: "DOWN",
  ArrowLeft: "LEFT",
  Left: "LEFT",
  a: "LEFT",
  A: "LEFT",
  ArrowRight: "RIGHT",
  Right: "RIGHT",
  d: "RIGHT",
  D: "RIGHT"
};
// Old TV browsers may leave `key` empty: legacy key codes as a fallback.
const KEY_CODES = { 37: "LEFT", 38: "UP", 39: "RIGHT", 40: "DOWN" };
const PAUSE_KEYS = new Set(["p", "P", "MediaPlayPause", "Pause"]);
const CHEATS = { F8: "god", F9: "skip" };
const SWIPE_MIN = 20;
const TYPING = "input, select, textarea";

function directionOf(event) {
  return KEYS[event.key] || KEY_CODES[event.keyCode] || null;
}

function swipeDirection(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) <= SWIPE_MIN) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "RIGHT" : "LEFT";
  return dy > 0 ? "DOWN" : "UP";
}

// handlers: { canPlay(), move(dir), pause(), cheat(name) }
export function bindInput({ board, dpad, handlers }) {
  const { canPlay, move, pause, cheat } = handlers;
  let swipeStart = null;

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey) return;
    if (event.metaKey || event.target.matches?.(TYPING) || !canPlay()) return;
    const dir = directionOf(event);
    if (dir) {
      event.preventDefault();
      move(dir);
      return;
    }
    // On a TV, Back (Escape) is the shared remote's: it presses ❚❚.
    const escape = event.key === "Escape" && !window.MuchogamesTv?.isOn();
    if (escape || PAUSE_KEYS.has(event.key)) {
      event.preventDefault();
      pause();
    } else if (CHEATS[event.key]) {
      event.preventDefault();
      cheat(CHEATS[event.key]);
    }
  }

  function onBoardDown(event) {
    if (!event.isPrimary) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  }

  function onBoardUp(event) {
    if (!swipeStart || !event.isPrimary) return;
    const dir = swipeDirection(
      event.clientX - swipeStart.x,
      event.clientY - swipeStart.y
    );
    swipeStart = null;
    if (dir && canPlay()) move(dir);
  }

  // Touch and mouse act on press (no click delay); a keyboard click on a
  // focused arrow (detail 0) still works.
  function onPadDown(event) {
    const button = event.target.closest("[data-dir]");
    if (!button || !event.isPrimary) return;
    event.preventDefault();
    if (canPlay()) move(button.dataset.dir);
  }

  function onPadClick(event) {
    const button = event.target.closest("[data-dir]");
    if (button && event.detail === 0 && canPlay()) move(button.dataset.dir);
  }

  const cancelSwipe = () => (swipeStart = null);
  const bindings = [
    [document, "keydown", onKey],
    [board, "pointerdown", onBoardDown],
    [board, "pointerup", onBoardUp],
    [board, "pointercancel", cancelSwipe],
    [dpad, "pointerdown", onPadDown],
    [dpad, "click", onPadClick]
  ];
  bindings.forEach(([target, type, fn]) => target.addEventListener(type, fn));
  return () =>
    bindings.forEach(([target, type, fn]) =>
      target.removeEventListener(type, fn)
    );
}
