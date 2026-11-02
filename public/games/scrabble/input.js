// Pointer input on the board and the rack. A press that moves less than 8 px
// is a tap; beyond that a ghost tile stays under the finger and is dropped
// on a cell or the rack. Keyboard activation arrives as a click with detail 0.
const DRAG_PX = 8;

function rackIndexAt(rackHost, x) {
  const slots = [...rackHost.querySelectorAll("[data-slot]")];
  const index = slots.findIndex((slot) => {
    const box = slot.getBoundingClientRect();
    return x < box.left + box.width / 2;
  });
  return index < 0 ? slots.length - 1 : index;
}

function dropTarget(hosts, x, y) {
  const node = document.elementFromPoint(x, y);
  const cell = node?.closest?.("[data-cell]");
  if (cell && hosts.board.contains(cell))
    return { cell: Number(cell.dataset.cell) };
  if (node && hosts.rack.contains(node))
    return { rack: rackIndexAt(hosts.rack, x) };
  return null;
}

function makeGhost(source) {
  const tile = source.querySelector(".sc-tile");
  const ghost = document.createElement("div");
  ghost.className = "sc-ghost";
  ghost.innerHTML = tile ? tile.outerHTML : "";
  document.body.append(ghost);
  return ghost;
}

// handlers: { canDrag(), slotOf(target) -> slot | -1, onRackTap(k),
//             onCellTap(i), onDrop(k, { cell } | { rack }) }
export function bindInput(hosts, handlers) {
  let press = null;

  function sourceOf(event) {
    const slot = event.target.closest("[data-slot]");
    if (
      slot &&
      hosts.rack.contains(slot) &&
      !slot.disabled &&
      slot.tagName === "BUTTON"
    )
      return { kind: "rack", el: slot, k: Number(slot.dataset.slot) };
    const cell = event.target.closest("[data-cell]");
    if (!cell || !hosts.board.contains(cell)) return null;
    const i = Number(cell.dataset.cell);
    return { kind: "cell", el: cell, i, k: handlers.slotOf(i) };
  }

  function onDown(event) {
    if (event.button > 0 || press) return;
    const source = sourceOf(event);
    if (!source) return;
    press = {
      ...source,
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      ghost: null
    };
    try {
      hosts.stage.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already released: moves still reach the stage while over it.
    }
  }

  function moveGhost(event) {
    press.ghost.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }

  function onMove(event) {
    if (!press || event.pointerId !== press.id) return;
    if (!press.ghost) {
      const far =
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_PX;
      if (!far || press.k < 0 || !handlers.canDrag()) return;
      press.ghost = makeGhost(press.el);
      press.el.classList.add("is-lifted");
    }
    moveGhost(event);
  }

  function finishDrag(event) {
    press.ghost.remove();
    press.el.classList.remove("is-lifted");
    const target = dropTarget(hosts, event.clientX, event.clientY);
    if (target) handlers.onDrop(press.k, target);
  }

  function onUp(event) {
    if (!press || event.pointerId !== press.id) return;
    if (press.ghost) finishDrag(event);
    else if (press.kind === "rack") handlers.onRackTap(press.k);
    else handlers.onCellTap(press.i);
    press = null;
  }

  function onCancel() {
    press?.ghost?.remove();
    press?.el.classList.remove("is-lifted");
    press = null;
  }

  function onClick(event) {
    if (event.detail !== 0) return;
    const source = sourceOf(event);
    if (source?.kind === "rack") handlers.onRackTap(source.k);
    else if (source) handlers.onCellTap(source.i);
  }

  hosts.stage.addEventListener("pointerdown", onDown);
  hosts.stage.addEventListener("pointermove", onMove);
  hosts.stage.addEventListener("pointerup", onUp);
  hosts.stage.addEventListener("pointercancel", onCancel);
  hosts.stage.addEventListener("click", onClick);
  return () => {
    onCancel();
    hosts.stage.removeEventListener("pointerdown", onDown);
    hosts.stage.removeEventListener("pointermove", onMove);
    hosts.stage.removeEventListener("pointerup", onUp);
    hosts.stage.removeEventListener("pointercancel", onCancel);
    hosts.stage.removeEventListener("click", onClick);
  };
}
