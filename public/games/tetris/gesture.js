// Touch (and mouse) on the play stage. Around the well: anywhere left of it
// moves left, right of it moves right (held = auto-repeat), below it soft
// drops. On the well: tap to rotate, drag sideways to move, drag down to soft
// drop, flick down to hard drop. Buttons (hold, pause) handle themselves.
const TAP_MAX_MS = 280;
const TAP_MAX_CELLS = 0.6;
const SOFT_CELLS = 1.5;
const FLICK_CELLS = 2;
const FLICK_SPEED = 0.7;
const FLICK_STALE_MS = 80;

// Above the well (the portrait HUD row) does nothing.
function zoneAt(rect, x, y) {
  if (y < rect.top) return null;
  if (y > rect.bottom) return "down";
  if (x < rect.left) return "left";
  if (x > rect.right) return "right";
  return "well";
}

class Surface {
  constructor({ well, cellSize, press, release }) {
    Object.assign(this, { well, cellSize, press, release });
    this.zones = new Map();
    this.g = null;
  }

  down = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = this.well.getBoundingClientRect();
    const zone = zoneAt(rect, event.clientX, event.clientY);
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
    else if (done && this.isTap(event, size)) this.tap("cw");
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
