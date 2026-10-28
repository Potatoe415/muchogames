// Pointer input on the board: a press selects or plays at once (tap a piece,
// then a square), dragging a piece and dropping it plays the move. Keyboard
// Enter/Space reach the square buttons as clicks with `detail === 0`.
const DRAG_THRESHOLD_PX = 8;

const squareOf = (target) => {
  const button = target.closest?.("[data-sq]");
  return button ? Number(button.dataset.sq) : -1;
};

export function bindInput({ view, canDrag, onPress, onDrop }) {
  const { grid } = view;
  let drag = null;

  function down(event) {
    if (event.button !== 0) return;
    const sq = squareOf(event.target);
    if (sq < 0) return;
    event.preventDefault();
    onPress(sq);
    if (!canDrag(sq)) return;
    drag = {
      sq,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false
    };
    grid.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
    if (!drag.moved && distance < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    view.dragTo(drag.sq, event.clientX, event.clientY);
  }

  function up(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const { sq, moved } = drag;
    drag = null;
    if (!moved) return;
    const target = view.squareAt(event.clientX, event.clientY);
    if (target === sq || !onDrop(sq, target)) view.dragEnd(sq);
  }

  function cancel() {
    if (drag?.moved) view.dragEnd(drag.sq);
    drag = null;
  }

  function click(event) {
    if (event.detail !== 0) return;
    const sq = squareOf(event.target);
    if (sq >= 0) onPress(sq);
  }

  const handlers = {
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: cancel,
    lostpointercapture: cancel,
    click,
    contextmenu: (event) => event.preventDefault()
  };
  Object.entries(handlers).forEach(([type, fn]) =>
    grid.addEventListener(type, fn)
  );
  return {
    destroy: () =>
      Object.entries(handlers).forEach(([type, fn]) =>
        grid.removeEventListener(type, fn)
      )
  };
}
