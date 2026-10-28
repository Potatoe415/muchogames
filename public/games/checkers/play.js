// One match on screen: selection, turn flow, computer moves, undo and hint.
// config: { mode: "solo"|"duo", level, side (local side in solo) }.
import { bindInput } from "./input.js";
import { crowns, DARK } from "./rules.js";
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
  const flipped = config.mode === "solo" && config.side === DARK;
  const view = createView({ host, variant: match.variant, flipped, t });
  const ui = { sel: null, hops: [], hint: null, busy: false, thinking: false };
  Object.assign(ui, {
    hintPending: false,
    hintTimer: 0,
    token: 0,
    over: false,
    showMoves
  });

  const isHuman = (side) => config.mode === "duo" || side === config.side;
  const humanTurn = () => !ui.over && !ui.busy && isHuman(match.turn);
  const forced = () => match.legal()[0]?.captures.length > 0;
  const canUndo = () =>
    !ui.over &&
    (!ui.busy || ui.thinking) &&
    (config.mode === "duo"
      ? match.plies > 0
      : Boolean(match.moveBy(config.side)));

  const candidates = () =>
    match
      .legal()
      .filter(
        (m) => m.from === ui.sel && ui.hops.every((sq, i) => m.path[i] === sq)
      );

  function marks() {
    const human = humanTurn();
    const cands = ui.sel === null ? [] : candidates();
    const depth = ui.hops.length;
    const last = match.lastMove();
    const showAll = human && (ui.showMoves || forced());
    return {
      selected: ui.sel,
      movable: new Set(
        showAll && ui.sel === null ? match.legal().map((m) => m.from) : []
      ),
      target: new Set(ui.showMoves || depth ? cands.map((m) => m.to) : []),
      step: new Set(
        cands.filter((m) => m.path.length > depth + 1).map((m) => m.path[depth])
      ),
      last: new Set(last ? [last.from, ...last.path] : []),
      hint: new Set(ui.hint ? [ui.hint.from, ...ui.hint.path] : [])
    };
  }

  function refresh() {
    view.mark(marks());
    onUpdate({
      thinking: ui.thinking,
      mustCapture: humanTurn() && forced(),
      canUndo: canUndo(),
      canHint: humanTurn() && !ui.hintPending
    });
  }

  function clearSelection() {
    ui.sel = null;
    ui.hops = [];
    ui.hint = null;
    clearTimeout(ui.hintTimer);
  }

  async function perform(move, options) {
    const token = ui.token;
    const crowned = crowns(match.board, match.variant, move);
    ui.busy = true;
    clearSelection();
    (move.captures.length ? sound.capture : sound.move)();
    match.play(move);
    onMoved();
    view.mark({});
    await view.animate(move, options);
    if (token !== ui.token) return;
    if (crowned) sound.crown();
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
      board: match.board,
      variant: match.variant.id,
      side: match.turn,
      level: config.level
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

  // Tap on a square: play a move ending there, walk one step of an ambiguous
  // capture route, or (re)select a piece that can move.
  function press(sq) {
    if (!humanTurn()) return;
    if (ui.sel !== null) {
      const cands = candidates();
      const ending = cands.filter((m) => m.to === sq);
      const via = cands.filter(
        (m) =>
          m.path.length > ui.hops.length + 1 && m.path[ui.hops.length] === sq
      );
      if (ending.length === 1 || (ending.length && !via.length))
        return void perform(ending[0]);
      if (via.length) {
        ui.hops.push(sq);
        return void refresh();
      }
    }
    const movable = match.legal().some((m) => m.from === sq);
    if (!movable && Math.sign(match.board[sq]) === match.turn) sound.invalid();
    const reselect = movable && !(ui.sel === sq && !ui.hops.length);
    clearSelection();
    if (reselect) ui.sel = sq;
    refresh();
  }

  function drop(from, to) {
    if (!humanTurn()) return false;
    const move = match.legal().find((m) => m.from === from && m.to === to);
    if (!move) {
      if (to >= 0) sound.invalid();
      return false;
    }
    perform(move, { direct: true });
    return true;
  }

  const canDrag = (sq) =>
    humanTurn() && match.legal().some((m) => m.from === sq);
  const input = bindInput({ view, canDrag, onPress: press, onDrop: drop });

  function undo() {
    if (!canUndo()) return;
    ui.token += 1;
    bot.reset();
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
    const request = {
      board: match.board,
      variant: match.variant.id,
      side: match.turn,
      level: "hint"
    };
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
