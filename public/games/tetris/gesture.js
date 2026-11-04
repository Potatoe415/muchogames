// Touch (and mouse) gestures on the well: drag sideways to move, drag down
// to soft drop, flick down to hard drop, tap to rotate.
const TAP_MAX_MS = 280;
const TAP_MAX_CELLS = 0.6;
const SOFT_CELLS = 1.5;
const FLICK_CELLS = 2;
const FLICK_SPEED = 0.7;
const FLICK_STALE_MS = 80;

class Gestures {
  constructor({ cellSize, press, release }) {
    this.cellSize = cellSize;
    this.press = press;
    this.release = release;
    this.g = null;
  }

  down = (event) => {
    this.g = {
      id: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      anchor: event.clientX,
      t0: event.timeStamp,
      tMove: event.timeStamp,
      moved: false,
      soft: false
    };
  };

  tap(name) {
    this.press(name);
    this.release(name);
  }

  move = (event) => {
    const { g } = this;
    if (!g || event.pointerId !== g.id) return;
    const size = this.cellSize();
    g.tMove = event.timeStamp;
    while (Math.abs(event.clientX - g.anchor) >= size) {
      const name = event.clientX > g.anchor ? "right" : "left";
      g.anchor += name === "right" ? size : -size;
      g.moved = true;
      this.tap(name);
    }
    if (!g.soft && event.clientY - g.y0 > size * SOFT_CELLS) {
      g.soft = true;
      g.moved = true;
      this.press("down");
    }
  };

  isFlick(event, size) {
    const { g } = this;
    const dy = event.clientY - g.y0;
    const dt = Math.max(1, event.timeStamp - g.t0);
    const fresh = event.timeStamp - g.tMove < FLICK_STALE_MS;
    return dy > size * FLICK_CELLS && fresh && dy / dt > FLICK_SPEED;
  }

  isTap(event, size) {
    const { g } = this;
    const dy = Math.abs(event.clientY - g.y0);
    const quick = event.timeStamp - g.t0 < TAP_MAX_MS;
    return !g.moved && quick && dy < size * TAP_MAX_CELLS;
  }

  up = (event) => {
    const { g } = this;
    if (!g || event.pointerId !== g.id) return;
    const size = this.cellSize();
    if (g.soft) this.release("down");
    if (this.isFlick(event, size)) this.press("drop");
    else if (this.isTap(event, size)) this.press("cw");
    this.g = null;
  };

  cancel = () => {
    if (this.g?.soft) this.release("down");
    this.g = null;
  };
}

// Returns a function that removes the listeners.
export function bindGestures({ el, ...rest }) {
  const gestures = new Gestures(rest);
  const life = new AbortController();
  const opts = { signal: life.signal };
  el.addEventListener(
    "pointerdown",
    (event) => {
      el.setPointerCapture?.(event.pointerId);
      gestures.down(event);
    },
    opts
  );
  el.addEventListener("pointermove", gestures.move, opts);
  el.addEventListener("pointerup", gestures.up, opts);
  el.addEventListener("pointercancel", gestures.cancel, opts);
  return () => life.abort();
}
