// Key and remote-control mapping to game actions.
const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "cw",
  " ": "drop",
  Enter: "drop",
  x: "cw",
  z: "ccw",
  Control: "ccw",
  c: "hold",
  Shift: "hold",
  p: "pause",
  Escape: "pause"
};
// Coloured remote keys: red = hold, green = rotate counter-clockwise
// (Tizen 403/404, Android TV 183/184).
const REMOTE_CODES = { 403: "hold", 183: "hold", 404: "ccw", 184: "ccw" };

export function actionOf(event) {
  const key = event.key ?? "";
  return KEYS[key] ?? KEYS[key.toLowerCase()] ?? REMOTE_CODES[event.keyCode];
}

// A focused button keeps Enter/Space for its own click.
export const ownsKey = (event) =>
  Boolean(event.target.closest?.("button, a, summary, input")) &&
  !event.key?.startsWith("Arrow");
