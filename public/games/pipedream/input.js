// Tap/click to place, mouse hover preview, Space or the >> button for
// fast-forward. Keyboard / TV remote: the focused canvas moves a cursor
// with the arrows and places with Enter; at a grid edge the arrow is left
// to tv-remote.js so the focus can reach the HUD and the header.
// Returns a function that removes every listener it added.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";
const ARROWS = {
  ArrowLeft: ["left", -1, 0],
  ArrowRight: ["right", 1, 0],
  ArrowUp: ["up", 0, -1],
  ArrowDown: ["down", 0, 1]
};

// Directions the canvas still handles from this cell (data-tv-keys).
function openKeys(cursor, size) {
  const keys = [];
  if (cursor.x > 0) keys.push("left");
  if (cursor.x < size.cols - 1) keys.push("right");
  if (cursor.y > 0) keys.push("up");
  if (cursor.y < size.rows - 1) keys.push("down");
  return keys.join(" ");
}

function bindCursor(canvas, actions) {
  const cursor = { x: 0, y: 0 };
  const clamp = (size) => {
    cursor.x = Math.min(Math.max(cursor.x, 0), size.cols - 1);
    cursor.y = Math.min(Math.max(cursor.y, 0), size.rows - 1);
    canvas.dataset.tvKeys = openKeys(cursor, size);
  };
  const onFocus = () => {
    clamp(actions.gridSize());
    actions.hover({ ...cursor });
  };
  const onKey = (event) => {
    const size = actions.gridSize();
    if (event.key === "Enter") {
      event.preventDefault();
      actions.unlock();
      clamp(size);
      actions.place(cursor.x, cursor.y);
      return;
    }
    const arrow = ARROWS[event.key];
    if (!arrow || event.defaultPrevented) return;
    event.preventDefault();
    cursor.x += arrow[1];
    cursor.y += arrow[2];
    clamp(size);
    actions.hover({ ...cursor });
  };
  return [
    [canvas, "focus", onFocus],
    [canvas, "blur", () => actions.hover(null)],
    [canvas, "keydown", onKey]
  ];
}

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
    [window, "keydown", onKey],
    ...bindCursor(canvas, actions)
  ];
  listeners.forEach(([target, type, fn]) =>
    target.addEventListener(type, fn, { passive: false })
  );
  return () =>
    listeners.forEach(([target, type, fn]) =>
      target.removeEventListener(type, fn)
    );
}
