// Board, pad, tool buttons and keyboard → play actions. Returns an unbind fn.
const ARROWS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1]
};
const ERASE_KEYS = ["backspace", "delete", "0"];

// `code` first so AZERTY digits work without Shift.
function digitOf(event) {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
  if (match) return Number(match[1]);
  return /^[1-9]$/.test(event.key) ? Number(event.key) : 0;
}

function keyAction(event, actions) {
  const digit = digitOf(event);
  if (digit) return () => actions.input(digit);
  if (ARROWS[event.key]) return () => actions.move(...ARROWS[event.key]);
  const key = event.key.toLowerCase();
  if (ERASE_KEYS.includes(key)) return actions.erase;
  const letters = {
    n: actions.toggleNotes,
    z: actions.undo,
    h: actions.hint,
    p: actions.togglePause
  };
  return letters[key] || null;
}

function onKey(event, actions) {
  const ctrlUndo = event.ctrlKey && event.key.toLowerCase() === "z";
  if (event.altKey || event.metaKey || (event.ctrlKey && !ctrlUndo)) return;
  if (actions.ignoreKeys()) return;
  const run = keyAction(event, actions);
  if (!run) return;
  event.preventDefault();
  run();
}

export function bindInput(els, actions) {
  const handlers = [
    [els.board, "click", (e) => {
      const cell = e.target.closest("[data-index]");
      if (cell) actions.select(Number(cell.dataset.index));
    }],
    [els.pad, "click", (e) => {
      const key = e.target.closest("[data-digit]");
      if (key) actions.input(Number(key.dataset.digit));
    }],
    [els.undo, "click", actions.undo],
    [els.erase, "click", actions.erase],
    [els.notes, "click", actions.toggleNotes],
    [els.hint, "click", actions.hint],
    [els.pause, "click", actions.togglePause],
    [els.continue, "click", actions.resume],
    [document, "keydown", (e) => onKey(e, actions)]
  ];
  handlers.forEach(([node, type, fn]) => node.addEventListener(type, fn));
  return () =>
    handlers.forEach(([node, type, fn]) => node.removeEventListener(type, fn));
}
