// One grid on screen: wires model, view, input and the timer, and saves the
// grid after every move so a reload can resume it.
import { UNITS, colOf, rowOf } from "./grid.js";
import { formatTime } from "./i18n.js";
import { bindInput } from "./input.js";
import { createModel } from "./model.js";
import { saveGame } from "./store.js";
import { createView } from "./view.js";

const WIN_DELAY_MS = 900;
const SAVE_EVERY_S = 5;

function render(ctx) {
  const { model, ui, els } = ctx;
  ctx.view.paint(model, ui, ctx.t);
  els.time.textContent = formatTime(model.state.seconds);
  els.mistakes.textContent = String(model.state.mistakes);
  els.notes.setAttribute("aria-pressed", String(ui.notesMode));
  els.undo.disabled = ui.over || !model.canUndo();
  els.hint.disabled = ui.over;
  els.hint.hidden = !ui.showHint;
  els.stage.classList.toggle("is-paused", ui.paused);
  els.pauseOverlay.hidden = !ui.paused;
}

function tick(ctx) {
  const { ui, model } = ctx;
  if (ui.paused || ui.hold || ui.over) return;
  model.state.seconds++;
  ctx.els.time.textContent = formatTime(model.state.seconds);
  if (model.state.seconds % SAVE_EVERY_S === 0) saveGame(model.state);
}

function win(ctx) {
  Object.assign(ctx.ui, { over: true, selected: -1, digit: 0 });
  clearInterval(ctx.timer);
  saveGame(null);
  ctx.view.flash(UNITS.slice(0, 9));
  render(ctx);
  const { seconds, mistakes, hints } = ctx.model.state;
  ctx.winTimer = setTimeout(
    () => ctx.onWin({ seconds, mistakes, hints }),
    WIN_DELAY_MS
  );
}

function afterMove(ctx, result) {
  if (!result) return;
  if (result.completed?.length) ctx.view.flash(result.completed);
  if (result.won) return win(ctx);
  saveGame(ctx.model.state);
  render(ctx);
}

const blocked = (ctx) => ctx.ui.paused || ctx.ui.over;

function select(ctx, i) {
  if (blocked(ctx)) return;
  ctx.ui.selected = i;
  ctx.ui.digit = 0;
  render(ctx);
}

// No editable cell selected: the digit only highlights where it already is.
function input(ctx, digit) {
  const { ui, model } = ctx;
  if (blocked(ctx)) return;
  const i = ui.selected;
  if (i < 0 || model.isGiven(i)) {
    ui.digit = ui.digit === digit ? 0 : digit;
    return render(ctx);
  }
  ui.digit = 0;
  if (ui.notesMode && !model.state.values[i]) {
    if (model.toggleNote(i, digit)) afterMove(ctx, {});
    return;
  }
  afterMove(ctx, model.setValue(i, digit));
}

function move(ctx, dRow, dCol) {
  const i = ctx.ui.selected < 0 ? 40 : ctx.ui.selected;
  const row = (rowOf(i) + dRow + 9) % 9;
  const col = (colOf(i) + dCol + 9) % 9;
  select(ctx, row * 9 + col);
}

function erase(ctx) {
  if (blocked(ctx) || ctx.ui.selected < 0) return;
  if (ctx.model.erase(ctx.ui.selected)) afterMove(ctx, {});
}

function undo(ctx) {
  if (blocked(ctx)) return;
  const i = ctx.model.undo();
  if (i < 0) return;
  ctx.ui.selected = i;
  ctx.ui.digit = 0;
  afterMove(ctx, {});
}

function hint(ctx) {
  if (blocked(ctx) || !ctx.ui.showHint) return;
  const result = ctx.model.hint(ctx.ui.selected);
  if (!result) return;
  ctx.ui.selected = result.index;
  ctx.ui.digit = 0;
  afterMove(ctx, result);
}

function setPaused(ctx, paused) {
  if (ctx.ui.over) return;
  ctx.ui.paused = paused;
  if (paused) saveGame(ctx.model.state);
  render(ctx);
}

function actionsFor(ctx) {
  return {
    select: (i) => select(ctx, i),
    input: (digit) => input(ctx, digit),
    move: (dRow, dCol) => move(ctx, dRow, dCol),
    erase: () => erase(ctx),
    undo: () => undo(ctx),
    hint: () => hint(ctx),
    toggleNotes: () => {
      ctx.ui.notesMode = !ctx.ui.notesMode;
      render(ctx);
    },
    togglePause: () => setPaused(ctx, !ctx.ui.paused),
    resume: () => setPaused(ctx, false),
    ignoreKeys: () => ctx.ui.hold
  };
}

export function createPlay({ els, state, prefs, t, onWin }) {
  const ctx = {
    els,
    t,
    onWin,
    model: createModel(state),
    view: createView({ board: els.board, pad: els.pad }),
    ui: { selected: -1, digit: 0, notesMode: false, paused: false },
    timer: 0,
    winTimer: 0
  };
  Object.assign(ctx.ui, { hold: false, over: false }, prefs);
  const unbind = bindInput(els, actionsFor(ctx));
  ctx.timer = setInterval(() => tick(ctx), 1000);
  render(ctx);
  return {
    setHold: (hold) => {
      ctx.ui.hold = hold;
      if (hold && !ctx.ui.over) saveGame(ctx.model.state);
    },
    setPrefs: ({ showErrors, showHint }) => {
      Object.assign(ctx.ui, { showErrors, showHint });
      render(ctx);
    },
    fillNotes: () => !blocked(ctx) && ctx.model.fillNotes() && afterMove(ctx, {}),
    relabel: () => render(ctx),
    destroy: () => {
      clearInterval(ctx.timer);
      clearTimeout(ctx.winTimer);
      unbind();
      if (!ctx.ui.over) saveGame(ctx.model.state);
    }
  };
}
