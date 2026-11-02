// Aim and drop. Touch/pen: press anywhere on the board, slide to aim, lift
// to drop. Mouse: the aim follows the pointer, a click drops. Keyboard and
// TV remote (board focused): ←/→ move the aim, Enter, Space or ↓ drops.
const KEY_SPEED = 0.9;
const DROP_KEYS = ["Enter", " ", "ArrowDown", "Down"];
const LEFT_KEYS = ["ArrowLeft", "Left"];
const RIGHT_KEYS = ["ArrowRight", "Right"];

export function createInput(canvas, { toBoxX, aim, nudge, drop, wake }) {
  let pressed = null;
  let direction = 0;

  const boxX = (event) => {
    const rect = canvas.getBoundingClientRect();
    return toBoxX((event.clientX - rect.left) / rect.width);
  };

  function onDown(event) {
    if (event.button > 0) return;
    wake();
    pressed = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    aim(boxX(event));
  }

  function onMove(event) {
    if (pressed === event.pointerId || event.pointerType === "mouse") {
      aim(boxX(event));
    }
  }

  function onUp(event) {
    if (pressed !== event.pointerId) return;
    pressed = null;
    aim(boxX(event));
    drop();
  }

  function onCancel() {
    pressed = null;
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (LEFT_KEYS.includes(event.key)) direction = -1;
    else if (RIGHT_KEYS.includes(event.key)) direction = 1;
    else if (DROP_KEYS.includes(event.key)) {
      if (!event.repeat) drop();
    } else return;
    wake();
    event.preventDefault();
  }

  function onKeyUp(event) {
    const releases =
      (direction < 0 && LEFT_KEYS.includes(event.key)) ||
      (direction > 0 && RIGHT_KEYS.includes(event.key));
    if (releases) direction = 0;
  }

  const listeners = [
    ["pointerdown", onDown],
    ["pointermove", onMove],
    ["pointerup", onUp],
    ["pointercancel", onCancel],
    ["keydown", onKeyDown],
    ["keyup", onKeyUp],
    ["blur", () => (direction = 0)]
  ];
  listeners.forEach(([name, fn]) => canvas.addEventListener(name, fn));

  return {
    update(dt) {
      if (direction) nudge(direction * KEY_SPEED * dt);
    },
    destroy() {
      listeners.forEach(([name, fn]) => canvas.removeEventListener(name, fn));
    }
  };
}
