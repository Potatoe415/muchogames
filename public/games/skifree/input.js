// Keyboard, mouse, touch and on-screen buttons. Arrow up jumps, on a keyboard
// and on a TV remote (some remotes omit event.code and leave focus on a
// button). W/Z and numpad 8 still brake and climb. Mouse: the cursor position
// relative to the skier sets the ski angle, left click jumps / flips, right
// click spins in the air. Touch: dragging on the lower half sets the angle
// from the finger's horizontal offset to the skier, a tap turns one notch
// (a tap just above the skier climbs), a second finger jumps. Returns a
// function removing every listener.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";
const TYPING = "input, select, textarea, [contenteditable]";
const MENU = "#optionsPanel, .sf-overlay, [role='dialog']";
const ARROWS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "jump",
  Left: "left",
  Right: "right",
  Down: "down",
  Up: "jump"
};
// Older TV browsers only fill keyCode.
const ARROW_CODES = { 37: "left", 38: "jump", 39: "right", 40: "down" };
const KEYS = {
  KeyA: "left",
  KeyQ: "left",
  Numpad4: "left",
  KeyD: "right",
  Numpad6: "right",
  KeyS: "down",
  Numpad2: "down",
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

function arrowAction(event) {
  if (ARROWS[event.code] || ARROWS[event.key])
    return ARROWS[event.code] || ARROWS[event.key];
  const bare = !event.key || event.key === "Unidentified";
  return bare ? ARROW_CODES[event.keyCode] : null;
}

function inMenu(event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(TYPING) || target.closest(MENU));
}

function keyHandler(actions) {
  return (event) => {
    const dir = NUMPAD_DIR[event.code];
    const arrow = arrowAction(event);
    const name = dir === undefined ? arrow || KEYS[event.code] : null;
    if (!name && dir === undefined) return;
    if (inMenu(event)) return;
    const onControl =
      event.target instanceof Element && event.target.closest(INTERACTIVE);
    if (onControl && !arrow && dir === undefined) return;
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
