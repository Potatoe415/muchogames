// Directions from the keyboard (arrows, ZQSD, WASD), the on-screen D-pad
// and swipes on the board. A press queues exactly one step (answered on the
// next tick); holding repeats at walking speed because the engine asks
// `next()` again whenever Chip is ready. Commands: R restart, P pause,
// N / B next / previous level.
import { E, N, S, W } from "./tiles.js";

const KEY_DIRS = {
  ArrowUp: N,
  ArrowLeft: W,
  ArrowDown: S,
  ArrowRight: E,
  z: N,
  w: N,
  q: W,
  a: W,
  s: S,
  d: E
};
const KEY_COMMANDS = { r: "restart", p: "pause", n: "next", b: "previous" };
const PAD_DIRS = { up: N, left: W, down: S, right: E };
const SWIPE_PX = 22;

function createHeld() {
  const held = [];
  let pending = -1;
  return {
    press(dir) {
      const i = held.indexOf(dir);
      if (i >= 0) held.splice(i, 1);
      held.push(dir);
      pending = dir;
    },
    release(dir) {
      const i = held.indexOf(dir);
      if (i >= 0) held.splice(i, 1);
    },
    clear() {
      held.length = 0;
      pending = -1;
    },
    next() {
      const dir = pending >= 0 ? pending : (held[held.length - 1] ?? -1);
      pending = -1;
      return dir;
    },
    dropTaps() {
      pending = -1;
    }
  };
}

function capture(element, event) {
  try {
    element.setPointerCapture(event.pointerId);
  } catch {
    // Pointer already released: the gesture simply isn't captured.
  }
}

function keyName(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

function bindKeys(state, actions, on) {
  on(window, "keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const name = keyName(event);
    const dir = KEY_DIRS[name];
    if (dir !== undefined) {
      event.preventDefault();
      actions.unlock();
      if (!event.repeat) state.press(dir);
    } else if (KEY_COMMANDS[name] && !event.repeat) {
      event.preventDefault();
      actions.command(KEY_COMMANDS[name]);
    }
  });
  on(window, "keyup", (event) => {
    const dir = KEY_DIRS[keyName(event)];
    if (dir !== undefined) state.release(dir);
  });
  on(window, "blur", () => state.clear());
}

function padDirAt(x, y) {
  const button = /** @type {HTMLElement | null | undefined} */ (
    document.elementFromPoint(x, y)?.closest("[data-pad]")
  );
  return button ? PAD_DIRS[button.dataset.pad] : undefined;
}

// One finger on the pad: press, slide to another arrow, release.
function bindPad(pad, state, actions, on) {
  const fingers = new Map();
  const move = (id, dir) => {
    const old = fingers.get(id);
    if (old === dir) return;
    if (old !== undefined) state.release(old);
    if (dir === undefined) fingers.delete(id);
    else {
      fingers.set(id, dir);
      state.press(dir);
    }
  };
  on(pad, "pointerdown", (event) => {
    event.preventDefault();
    actions.unlock();
    capture(pad, event);
    move(event.pointerId, padDirAt(event.clientX, event.clientY));
  });
  on(pad, "pointermove", (event) => {
    if (fingers.has(event.pointerId) || event.buttons) {
      move(event.pointerId, padDirAt(event.clientX, event.clientY));
    }
  });
  const end = (event) => move(event.pointerId, undefined);
  on(pad, "pointerup", end);
  on(pad, "pointercancel", end);
}

function swipeDir(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return undefined;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? W : E;
  return dy < 0 ? N : S;
}

// Swipe = one step; keep the finger down after a swipe to keep walking.
function bindSwipe(board, state, actions, on) {
  let touch = null;
  on(board, "pointerdown", (event) => {
    event.preventDefault();
    actions.unlock();
    capture(board, event);
    touch = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dir: undefined
    };
  });
  on(board, "pointermove", (event) => {
    if (!touch || touch.id !== event.pointerId) return;
    const dir = swipeDir(event.clientX - touch.x, event.clientY - touch.y);
    if (dir === undefined || dir === touch.dir) return;
    if (touch.dir !== undefined) state.release(touch.dir);
    state.press(dir);
    Object.assign(touch, { dir, x: event.clientX, y: event.clientY });
  });
  const end = (event) => {
    if (!touch || touch.id !== event.pointerId) return;
    if (touch.dir !== undefined) state.release(touch.dir);
    touch = null;
  };
  on(board, "pointerup", end);
  on(board, "pointercancel", end);
}

export function bindInput({ root, board, pad, actions }) {
  const state = createHeld();
  const offs = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    offs.push(() => target.removeEventListener(type, fn, opts));
  };
  bindKeys(state, actions, on);
  bindPad(pad, state, actions, on);
  bindSwipe(board, state, actions, on);
  const block = (event) => event.preventDefault();
  on(root, "contextmenu", block);
  on(root, "gesturestart", block);
  on(root, "touchmove", block, { passive: false });
  return {
    next: state.next,
    dropTaps: state.dropTaps,
    clear: state.clear,
    destroy() {
      offs.forEach((off) => off());
      state.clear();
    }
  };
}
