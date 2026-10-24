// Pointer, wheel and keyboard controls. Left click / one-finger tap on the
// grid builds a wall; right click, wheel, Space, the axis button or a
// second finger flip the axis. Swipe mode (touch only): the swipe direction
// picks the axis. Returns a function removing every listener.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";
const WHEEL_GAP_MS = 220;
const SWIPE_PX = 14;

function pointToCell(event, canvas, toCell) {
  const rect = canvas.getBoundingClientRect();
  return toCell(event.clientX - rect.left, event.clientY - rect.top);
}

// The wall starts from the cell under the finger as soon as it has moved
// SWIPE_PX: left/right builds a horizontal wall, up/down a vertical one.
// The swipe direction also aims the single ray of a second wall.
function createSwiper(actions) {
  let start = null;
  return {
    down(event, cell) {
      start = cell
        ? { id: event.pointerId, x: event.clientX, y: event.clientY, cell }
        : null;
    },
    move(event) {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
      const { cell } = start;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      start = null;
      actions.build(
        cell.x,
        cell.y,
        horizontal ? "h" : "v",
        Math.sign(horizontal ? dx : dy)
      );
    },
    up(event) {
      if (start?.id === event.pointerId) start = null;
    }
  };
}

export function bindInput({ canvas, root, axisButton, toCell, actions }) {
  const touches = new Set();
  const swiper = createSwiper(actions);
  let lastWheel = 0;

  const build = (event) => {
    const cell = pointToCell(event, canvas, toCell);
    if (cell) actions.build(cell.x, cell.y);
  };
  const onMouseDown = (event) => {
    if (event.target !== canvas) return;
    event.preventDefault();
    if (event.button === 0) build(event);
    else if (event.button === 2) actions.toggle();
  };
  const onTouchDown = (event) => {
    if (event.isPrimary) touches.clear();
    touches.add(event.pointerId);
    const swipe = actions.swipe();
    if (touches.size > 1) {
      event.preventDefault();
      if (!swipe) actions.twoFinger();
    } else if (event.target === canvas) {
      event.preventDefault();
      if (swipe) swiper.down(event, pointToCell(event, canvas, toCell));
      else build(event);
    }
  };
  const onDown = (event) => {
    if (event.target.closest?.(INTERACTIVE)) return;
    actions.unlock();
    if (event.pointerType === "mouse") onMouseDown(event);
    else onTouchDown(event);
  };
  const onUp = (event) => {
    touches.delete(event.pointerId);
    swiper.up(event);
  };
  const onMove = (event) => {
    if (event.pointerType === "mouse") {
      actions.hover(pointToCell(event, canvas, toCell));
    } else {
      swiper.move(event);
    }
  };
  const onLeave = () => actions.hover(null);
  const onWheel = (event) => {
    event.preventDefault();
    if (event.timeStamp - lastWheel < WHEEL_GAP_MS) return;
    lastWheel = event.timeStamp;
    actions.toggle();
  };
  const onKey = (event) => {
    if (event.code !== "Space" || event.repeat) return;
    if (event.target.closest?.(INTERACTIVE)) return;
    event.preventDefault();
    actions.unlock();
    actions.toggle();
  };
  const onAxis = () => {
    actions.unlock();
    actions.toggle();
  };
  const block = (event) => event.preventDefault();
  const listeners = [
    [root, "pointerdown", onDown],
    [window, "pointerup", onUp],
    [window, "pointercancel", onUp],
    [canvas, "pointermove", onMove],
    [canvas, "pointerleave", onLeave],
    [canvas, "wheel", onWheel],
    [root, "contextmenu", block],
    [root, "gesturestart", block],
    [root, "dblclick", block],
    [root, "touchmove", block],
    [axisButton, "click", onAxis],
    [window, "keydown", onKey]
  ];
  listeners.forEach(([target, type, fn]) =>
    target.addEventListener(type, fn, { passive: false })
  );
  return () =>
    listeners.forEach(([target, type, fn]) =>
      target.removeEventListener(type, fn)
    );
}
