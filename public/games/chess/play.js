// One match on screen: selection, promotion, turn flow, computer moves, undo
// and hint. config: { mode: "solo"|"duo", level, side (local side in solo) }.
import { bindInput } from "./input.js";
import { askPromotion, cancelPromotion } from "./promo.js";
import { BLACK, kingSquare, sideOf } from "./rules.js";
import { sound } from "./sound.js";
import { createView } from "./view.js";

const MIN_THINK_MS = 450;
const HINT_MS = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createPlay({
  host,
  match,
  config,
  bot,
  t,
  showMoves,
  onUpdate,
  onMoved,
  onEnd
}) {
  const flipped = config.mode === "solo" && config.side === BLACK;
  const view = createView({ host, flipped, t });
  const ui = { sel: null, hint: null, busy: false, thinking: false };
  Object.assign(ui, {
    hintPending: false,
    hintTimer: 0,
    token: 0,
    over: false,
    showMoves
  });

  const isHuman = (side) => config.mode === "duo" || side === config.side;
  const humanTurn = () => !ui.over && !ui.busy && isHuman(match.turn);
  const canUndo = () =>
    !ui.over &&
    (!ui.busy || ui.thinking) &&
    (config.mode === "duo"
      ? match.plies > 0
      : Boolean(match.moveBy(config.side)));
  const movesFrom = (sq) => match.legal().filter((m) => m.from === sq);

  function marks() {
    const shown = ui.sel !== null && ui.showMoves ? movesFrom(ui.sel) : [];
    const last = match.lastMove();
    return {
      selected: ui.sel,
      target: new Set(shown.filter((m) => m.taken < 0).map((m) => m.to)),
      capture: new Set(shown.filter((m) => m.taken >= 0).map((m) => m.to)),
      last: new Set(last ? [last.from, last.to] : []),
      hint: new Set(ui.hint ? [ui.hint.from, ui.hint.to] : []),
      check: match.inCheck() ? kingSquare(match.board, match.turn) : -1
    };
  }

  function refresh() {
    view.mark(marks());
    onUpdate({
      thinking: ui.thinking,
      canUndo: canUndo(),
      canHint: humanTurn() && !ui.hintPending
    });
  }

  function clearSelection() {
    ui.sel = null;
    ui.hint = null;
    clearTimeout(ui.hintTimer);
  }

  async function perform(m) {
    const token = ui.token;
    ui.busy = true;
    clearSelection();
    (m.taken >= 0 ? sound.capture : sound.move)();
    match.play(m);
    onMoved();
    view.mark({});
    await view.animate(m);
    if (token !== ui.token) return;
    if (m.promo) sound.promote();
    else if (match.inCheck()) sound.check();
    view.render(match.board);
    ui.busy = false;
    next();
  }

  async function computerMove() {
    const token = ui.token;
    ui.busy = true;
    ui.thinking = true;
    refresh();
    const request = {
      pos: match.position,
      level: config.level,
      seen: match.keys()
    };
    const [index] = await Promise.all([bot.think(request), wait(MIN_THINK_MS)]);
    if (token !== ui.token) return;
    ui.thinking = false;
    perform(match.legal()[index] || match.legal()[0]);
  }

  function next() {
    const status = match.status();
    if (status.over) ui.over = true;
    refresh();
    if (status.over) onEnd(status);
    else if (!isHuman(match.turn)) computerMove();
  }

  // Plays the move from `from` to `to`, asking which piece a pawn becomes.
  async function playTo(from, to) {
    const options = movesFrom(from).filter((m) => m.to === to);
    if (options.length === 1) return void perform(options[0]);
    const token = ui.token;
    ui.busy = true;
    refresh();
    const type = await askPromotion(match.turn);
    if (token !== ui.token) return;
    ui.busy = false;
    const chosen = options.find((m) => m.promo === type);
    if (chosen) perform(chosen);
    else refresh();
  }

  // Tap on a square: play the selected piece there, or (re)select a piece.
  function press(sq) {
    if (!humanTurn()) return;
    if (ui.sel !== null && movesFrom(ui.sel).some((m) => m.to === sq))
      return void playTo(ui.sel, sq);
    const movable = movesFrom(sq).length > 0;
    if (!movable && sideOf(match.board[sq]) === match.turn) sound.invalid();
    const reselect = movable && ui.sel !== sq;
    clearSelection();
    if (reselect) ui.sel = sq;
    refresh();
  }

  function drop(from, to) {
    if (!humanTurn()) return false;
    if (!movesFrom(from).some((m) => m.to === to)) {
      if (to >= 0) sound.invalid();
      return false;
    }
    view.dragEnd(from);
    playTo(from, to);
    return true;
  }

  const canDrag = (sq) => humanTurn() && movesFrom(sq).length > 0;
  const input = bindInput({ view, canDrag, onPress: press, onDrop: drop });

  function undo() {
    if (!canUndo()) return;
    ui.token += 1;
    bot.reset();
    cancelPromotion();
    do {
      match.undo();
    } while (match.plies > 0 && !isHuman(match.turn));
    Object.assign(ui, { busy: false, thinking: false, hintPending: false });
    clearSelection();
    view.render(match.board);
    onMoved();
    next();
  }

  async function hint() {
    if (!humanTurn() || ui.hintPending) return;
    const token = ui.token;
    const plies = match.plies;
    ui.hintPending = true;
    refresh();
    const request = { pos: match.position, level: "hint", seen: match.keys() };
    const index = await bot.think(request);
    ui.hintPending = false;
    if (token !== ui.token || plies !== match.plies) return void refresh();
    clearSelection();
    ui.hint = match.legal()[index] || null;
    ui.sel = ui.hint?.from ?? null;
    ui.hintTimer = setTimeout(() => {
      ui.hint = null;
      refresh();
    }, HINT_MS);
    refresh();
  }

  function setShowMoves(on) {
    ui.showMoves = on;
    refresh();
  }

  function destroy() {
    ui.token += 1;
    clearTimeout(ui.hintTimer);
    cancelPromotion();
    bot.reset();
    input.destroy();
    view.destroy();
  }

  view.render(match.board);
  next();
  return {
    undo,
    hint,
    setShowMoves,
    relabel: () => (view.relabel(), refresh()),
    destroy
  };
}
