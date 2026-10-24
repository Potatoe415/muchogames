// Pointer, wheel and keyboard controls. Left click / one-finger tap on the
// grid builds a wall; right click, wheel, Space, the axis button or a
// second finger flip the axis. Returns a function removing every listener.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";
const WHEEL_GAP_MS = 220;

function pointToCell(event, canvas, toCell) {
  const rect = canvas.getBoundingClientRect();
  return toCell(event.clientX - rect.left, event.clientY - rect.top);
}

export function bindInput({ canvas, root, axisButton, toCell, actions }) {
  const touches = new Set();
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
    if (touches.size > 1) {
      event.preventDefault();
      actions.twoFinger();
    } else if (event.target === canvas) {
      event.preventDefault();
      build(event);
    }
  };
  const onDown = (event) => {
    if (event.target.closest?.(INTERACTIVE)) return;
    actions.unlock();
    if (event.pointerType === "mouse") onMouseDown(event);
    else onTouchDown(event);
  };
  const onUp = (event) => touches.delete(event.pointerId);
  const onMove = (event) => {
    if (event.pointerType === "mouse") {
      actions.hover(pointToCell(event, canvas, toCell));
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
