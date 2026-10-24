// Tap/click to place, mouse hover preview, Space or the >> button for
// fast-forward. Returns a function that removes every listener it added.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";

function pointToCell(event, canvas, toCell) {
  const rect = canvas.getBoundingClientRect();
  return toCell(event.clientX - rect.left, event.clientY - rect.top);
}

export function bindInput({ canvas, root, fastButton, toCell, actions }) {
  const onDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    actions.unlock();
    const cell = pointToCell(event, canvas, toCell);
    if (cell) actions.place(cell.x, cell.y);
  };
  const onMove = (event) => {
    if (event.pointerType === "mouse") {
      actions.hover(pointToCell(event, canvas, toCell));
    }
  };
  const onLeave = () => actions.hover(null);
  const onKey = (event) => {
    if (event.code !== "Space" || event.repeat) return;
    if (event.target.closest?.(INTERACTIVE)) return;
    event.preventDefault();
    actions.unlock();
    actions.fast();
  };
  const onFast = () => {
    actions.unlock();
    actions.fast();
  };
  const block = (event) => event.preventDefault();
  const listeners = [
    [canvas, "pointerdown", onDown],
    [canvas, "pointermove", onMove],
    [canvas, "pointerleave", onLeave],
    [canvas, "contextmenu", block],
    [root, "gesturestart", block],
    [root, "dblclick", block],
    [root, "touchmove", block],
    [fastButton, "click", onFast],
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
