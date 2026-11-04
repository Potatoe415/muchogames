// Touch (and mouse) on the play stage. Left of the well and its first 2
// columns move left, its last 2 columns and right of it move right (held =
// auto-repeat), below it soft drops. On the rest of the well: double tap to
// hard drop (a single tap does nothing), swipe up to rotate, drag sideways to
// move, drag down to soft drop, flick down to hard drop. Buttons handle
// themselves.
const TAP_MAX_MS = 280;
const TAP_MAX_CELLS = 0.6;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_CELLS = 1.5;
const SOFT_CELLS = 1.5;
const FLICK_CELLS = 2;
const FLICK_SPEED = 0.7;
const FLICK_STALE_MS = 80;
const SWIPE_UP_CELLS = 1.5;
const EDGE_COLS = 2;

// Above the well (the portrait HUD row) does nothing.
function zoneAt(rect, edge, x, y) {
  if (y < rect.top) return null;
  if (y > rect.bottom) return "down";
  if (x < rect.left + edge) return "left";
  if (x > rect.right - edge) return "right";
  return "well";
}

class Surface {
  constructor({ well, cellSize, press, release }) {
    Object.assign(this, { well, cellSize, press, release });
    this.zones = new Map();
    this.g = null;
    this.lastTap = null;
  }

  down = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = this.well.getBoundingClientRect();
    const edge = this.cellSize() * EDGE_COLS;
    const zone = zoneAt(rect, edge, event.clientX, event.clientY);
    if (!zone || (zone === "well" && this.g)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (zone === "well") return this.startDrag(event);
    this.zones.set(event.pointerId, zone);
    this.press(zone);
  };

  startDrag(event) {
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
  }

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

  isSwipeUp(event, size) {
    const { g } = this;
    return !g.soft && g.y0 - event.clientY > size * SWIPE_UP_CELLS;
  }

  // Only a second tap, soon after and near the first, acts: it hard drops.
  onTap(event, size) {
    const last = this.lastTap;
    const gap = last && event.timeStamp - last.t;
    const dist =
      last && Math.hypot(event.clientX - last.x, event.clientY - last.y);
    if (last && gap < DOUBLE_TAP_MS && dist < size * DOUBLE_TAP_CELLS) {
      this.tap("drop");
      this.lastTap = null;
      return;
    }
    this.lastTap = { x: event.clientX, y: event.clientY, t: event.timeStamp };
  }

  // Ends a pointer; `done` = lifted (not cancelled), so it may act.
  end(event, done) {
    const zone = this.zones.get(event.pointerId);
    if (zone) {
      this.zones.delete(event.pointerId);
      return this.release(zone);
    }
    const { g } = this;
    if (!g || event.pointerId !== g.id) return;
    const size = this.cellSize();
    if (g.soft) this.release("down");
    if (done && this.isFlick(event, size)) this.tap("drop");
    else if (done && this.isSwipeUp(event, size)) this.tap("cw");
    else if (done && this.isTap(event, size)) this.onTap(event, size);
    this.g = null;
  }

  up = (event) => this.end(event, true);

  cancel = (event) => this.end(event, false);
}

// Returns a function that removes the listeners.
export function bindGestures({ el, ...rest }) {
  const surface = new Surface(rest);
  const life = new AbortController();
  const opts = { signal: life.signal };
  el.addEventListener("pointerdown", surface.down, opts);
  el.addEventListener("pointermove", surface.move, opts);
  el.addEventListener("pointerup", surface.up, opts);
  el.addEventListener("pointercancel", surface.cancel, opts);
  return () => life.abort();
}
