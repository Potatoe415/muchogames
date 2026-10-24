// Keyboard, mouse, touch and on-screen buttons. Mouse: the cursor position
// relative to the skier sets the ski angle, left click jumps / flips, right
// click spins in the air. Touch: dragging on the lower half sets the angle
// from the finger's horizontal offset to the skier, a tap turns one notch
// (a tap just above the skier climbs), a second finger jumps. Returns a
// function removing every listener.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";
const KEYS = {
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  Numpad4: "left",
  ArrowRight: "right",
  KeyD: "right",
  Numpad6: "right",
  ArrowDown: "down",
  KeyS: "down",
  Numpad2: "down",
  ArrowUp: "up",
  KeyW: "up",
  KeyZ: "up",
  Numpad8: "up",
  Space: "jump",
  Enter: "jump",
  NumpadEnter: "jump",
  Numpad5: "jump",
  Numpad0: "jump",
  KeyF: "turbo",
  KeyP: "pause",
  F3: "pause",
  KeyR: "restart",
  F2: "restart"
};
const NUMPAD_DIR = { Numpad7: -3, Numpad1: -1, Numpad3: 1, Numpad9: 3 };
const ONCE = new Set(["jump", "turbo", "pause", "restart"]);
const TAP_MS = 300;
const TAP_MOVE = 12;
const DRAG_REACH = 0.75;
const CLIMB_ZONE = 0.12;
const MOUSE_DEADZONE = 6;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function local(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function mouseDir(dx, dy) {
  if (dy <= MOUSE_DEADZONE) return dx < 0 ? -3 : 3;
  return Math.round((Math.atan2(dx, dy) * 180) / Math.PI / 30);
}

function createTouch(canvas, skierAt, actions) {
  let finger = null;
  const fingerDir = (x) => {
    const reach = (canvas.clientWidth / 2) * DRAG_REACH;
    return Math.round(clamp((x - skierAt().x) / reach, -1, 1) * 3);
  };
  const tap = ({ x }, lower) => {
    const dx = x - skierAt().x;
    const climb = !lower && Math.abs(dx) < canvas.clientWidth * CLIMB_ZONE;
    actions.command(climb ? "up" : dx < 0 ? "left" : "right");
  };
  return {
    down(event) {
      if (finger) return actions.command("jump");
      const p = local(event, canvas);
      const lower = p.y > canvas.clientHeight / 2;
      finger = {
        id: event.pointerId,
        ...p,
        t0: event.timeStamp,
        lower,
        drag: false
      };
    },
    move(event) {
      if (event.pointerId !== finger?.id) return;
      const p = local(event, canvas);
      const moved = Math.hypot(p.x - finger.x, p.y - finger.y) > TAP_MOVE;
      if (finger.lower && moved) finger.drag = true;
      if (finger.drag) actions.steer(fingerDir(p.x));
    },
    up(event) {
      if (event.pointerId !== finger?.id) return;
      const quick = event.timeStamp - finger.t0 < TAP_MS;
      if (!finger.drag && quick) tap(finger, finger.lower);
      finger = null;
    }
  };
}

function keyHandler(actions) {
  return (event) => {
    if (event.target.closest?.(INTERACTIVE)) return;
    const name = KEYS[event.code];
    const dir = NUMPAD_DIR[event.code];
    if (!name && dir === undefined) return;
    event.preventDefault();
    actions.unlock();
    if (dir !== undefined) return actions.steer(dir);
    if (event.repeat && ONCE.has(name)) return;
    actions.command(name);
  };
}

function pointerHandlers(canvas, skierAt, actions) {
  const touch = createTouch(canvas, skierAt, actions);
  const isMouse = (event) => event.pointerType === "mouse";
  return {
    down(event) {
      if (event.target !== canvas) return;
      event.preventDefault();
      actions.unlock();
      if (!isMouse(event)) return touch.down(event);
      if (event.button === 0) actions.command("jump");
      else if (event.button === 2) actions.airSpin(1);
    },
    move(event) {
      if (!isMouse(event)) return touch.move(event);
      const p = local(event, canvas);
      const s = skierAt();
      if (Math.hypot(p.x - s.x, p.y - s.y) < MOUSE_DEADZONE) return;
      actions.steer(mouseDir(p.x - s.x, p.y - s.y));
    },
    up: (event) => isMouse(event) || touch.up(event)
  };
}

function pressButton(button, run) {
  return (event) => {
    event.preventDefault();
    button.blur();
    run();
  };
}

export function bindInput({ canvas, root, buttons, skierAt, actions }) {
  const pointer = pointerHandlers(canvas, skierAt, actions);
  const block = (event) => event.preventDefault();
  const jump = pressButton(buttons.jump, () => {
    actions.unlock();
    actions.command("jump");
  });
  const turbo = pressButton(buttons.turbo, () => actions.command("turbo"));
  const listeners = [
    [canvas, "pointerdown", pointer.down],
    [canvas, "pointermove", pointer.move],
    [window, "pointerup", pointer.up],
    [window, "pointercancel", pointer.up],
    [buttons.jump, "pointerdown", jump],
    [buttons.jump, "click", (event) => event.detail === 0 && jump(event)],
    [buttons.turbo, "click", turbo],
    [root, "contextmenu", block],
    [root, "gesturestart", block],
    [root, "dblclick", block],
    [root, "touchmove", block],
    [window, "keydown", keyHandler(actions)]
  ];
  listeners.forEach(([target, type, fn]) =>
    target.addEventListener(type, fn, { passive: false })
  );
  return () =>
    listeners.forEach(([target, type, fn]) =>
      target.removeEventListener(type, fn)
    );
}
