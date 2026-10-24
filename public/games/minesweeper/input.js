// Pointer, touch and keyboard input on the grid. Tap/left click = primary
// action, long press/right click/F key = flag.
const LONG_PRESS_MS = 380;
const MOVE_TOLERANCE = 10;

const cellIndex = (target) => {
  const cell = target instanceof Element ? target.closest(".ms-cell") : null;
  return cell ? Number(cell.dataset.index) : -1;
};

export function bindInput(host, { onPrimary, onFlag }) {
  let press = null;

  function cancelPress() {
    if (!press) return;
    clearTimeout(press.timer);
    press.cell.classList.remove("is-pressed");
    press = null;
  }

  function startPress(event, index) {
    const cell = event.target.closest(".ms-cell");
    cell.classList.add("is-pressed");
    press = {
      id: event.pointerId,
      index,
      cell,
      x: event.clientX,
      y: event.clientY
    };
    press.timer = setTimeout(() => {
      cell.classList.remove("is-pressed");
      press.fired = true;
      navigator.vibrate?.(15);
      onFlag(index);
    }, LONG_PRESS_MS);
  }

  function onPointerDown(event) {
    const index = cellIndex(event.target);
    if (index < 0) return;
    if (event.button === 2) {
      event.preventDefault();
      onFlag(index);
      return;
    }
    if (event.button !== 0 || press) return;
    startPress(event, index);
  }

  function onPointerMove(event) {
    if (!press || event.pointerId !== press.id || press.fired) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (moved > MOVE_TOLERANCE) cancelPress();
  }

  function onPointerUp(event) {
    if (!press || event.pointerId !== press.id) return;
    const { fired, index } = press;
    cancelPress();
    if (!fired) onPrimary(index);
  }

  // Keyboard activation (Enter/Space) arrives as a click with detail 0;
  // pointer clicks are already handled on pointerup.
  function onClick(event) {
    if (event.detail !== 0) return;
    const index = cellIndex(event.target);
    if (index >= 0) onPrimary(index);
  }

  function onKeyDown(event) {
    if (event.key !== "f" && event.key !== "F") return;
    const index = cellIndex(event.target);
    if (index >= 0) onFlag(index);
  }

  const preventMenu = (event) => event.preventDefault();
  const listeners = [
    ["pointerdown", onPointerDown],
    ["pointermove", onPointerMove],
    ["pointerup", onPointerUp],
    ["pointercancel", cancelPress],
    ["click", onClick],
    ["keydown", onKeyDown],
    ["contextmenu", preventMenu]
  ];
  listeners.forEach(([type, fn]) => host.addEventListener(type, fn));

  return function unbind() {
    cancelPress();
    listeners.forEach(([type, fn]) => host.removeEventListener(type, fn));
  };
}
