// Moves from the keyboard (arrows, WASD, ZQSD) anywhere on the page, a swipe
// on the board, or a tap near one of its edges (the tap alternative to the
// swipe).
const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Left: "left",
  Right: "right",
  Up: "up",
  Down: "down",
  a: "left",
  q: "left",
  d: "right",
  w: "up",
  z: "up",
  s: "down"
};
const SWIPE_PX = 24;
const TAP_DEAD_ZONE = 0.12;
const TYPING = "input, textarea, select";

function dominant(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function createInput({ board, onMove, enabled }) {
  let start = null;

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey) return;
    if (event.metaKey || event.target.closest?.(TYPING)) return;
    const key = event.key?.length === 1 ? event.key.toLowerCase() : event.key;
    const dir = KEYS[key];
    if (!dir || !enabled()) return;
    event.preventDefault();
    onMove(dir);
  }

  function onDown(event) {
    if (!event.isPrimary || event.button > 0) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    board.setPointerCapture?.(event.pointerId);
  }

  function tapDirection(event) {
    const rect = board.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const reach = Math.max(Math.abs(dx), Math.abs(dy));
    return reach < rect.width * TAP_DEAD_ZONE ? null : dominant(dx, dy);
  }

  function onUp(event) {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    const swiped = Math.hypot(dx, dy) >= SWIPE_PX;
    const dir = swiped ? dominant(dx, dy) : tapDirection(event);
    if (dir && enabled()) onMove(dir);
  }

  const cancel = () => (start = null);

  document.addEventListener("keydown", onKey);
  board.addEventListener("pointerdown", onDown);
  board.addEventListener("pointerup", onUp);
  board.addEventListener("pointercancel", cancel);

  return {
    destroy() {
      document.removeEventListener("keydown", onKey);
      board.removeEventListener("pointerdown", onDown);
      board.removeEventListener("pointerup", onUp);
      board.removeEventListener("pointercancel", cancel);
    }
  };
}
