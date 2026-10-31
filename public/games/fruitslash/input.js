// Touch, mouse and keyboard all drive the same blade. Pointer: press and
// drag (one finger at a time). Keyboard: the arrow keys move a glowing
// cursor that cuts while it moves.
const KEY_DIRS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
};
// Keyboard cursor speed, in shorter sides of the play area per second.
const KEY_SPEED = 1.2;

export function createInput(canvas, blade) {
  let pointerId = null;
  let cursor = null;
  let keyCutting = false;
  const held = new Set();

  const local = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function onDown(event) {
    if (pointerId !== null) return;
    event.preventDefault();
    pointerId = event.pointerId;
    try {
      canvas.setPointerCapture(pointerId);
    } catch {
      // Pointer already gone: the blade still follows it over the canvas.
    }
    cursor = null;
    blade.start(local(event));
  }

  function onMove(event) {
    if (event.pointerId !== pointerId) return;
    const events = event.getCoalescedEvents?.() || [];
    (events.length ? events : [event]).forEach((e) => blade.move(local(e)));
  }

  function onUp(event) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    blade.end();
  }

  function onKey(event) {
    if (!KEY_DIRS[event.key]) return;
    event.preventDefault();
    if (event.type === "keydown") held.add(event.key);
    else held.delete(event.key);
  }

  const onBlur = () => held.clear();

  const listeners = [
    [canvas, "pointerdown", onDown],
    [canvas, "pointermove", onMove],
    [canvas, "pointerup", onUp],
    [canvas, "pointercancel", onUp],
    [window, "keydown", onKey],
    [window, "keyup", onKey],
    [window, "blur", onBlur]
  ];
  listeners.forEach(([target, type, fn]) => target.addEventListener(type, fn));

  function heldDirection() {
    let dx = 0;
    let dy = 0;
    held.forEach((key) => {
      dx += KEY_DIRS[key][0];
      dy += KEY_DIRS[key][1];
    });
    const length = Math.hypot(dx, dy);
    return length ? { dx: dx / length, dy: dy / length } : null;
  }

  // Called every simulation step with the play area size in CSS pixels.
  function update(dt, size) {
    const dir = heldDirection();
    if (!dir) {
      if (keyCutting) blade.end();
      keyCutting = false;
      return;
    }
    cursor = cursor || { x: size.w / 2, y: size.h / 2 };
    if (!keyCutting) blade.start(cursor);
    keyCutting = true;
    const step = KEY_SPEED * Math.min(size.w, size.h) * dt;
    cursor = {
      x: Math.min(size.w, Math.max(0, cursor.x + dir.dx * step)),
      y: Math.min(size.h, Math.max(0, cursor.y + dir.dy * step))
    };
    blade.move(cursor);
  }

  return {
    update,
    get cursor() {
      return cursor;
    },
    destroy() {
      listeners.forEach(([target, type, fn]) =>
        target.removeEventListener(type, fn)
      );
    }
  };
}
