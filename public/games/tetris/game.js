// One match: engine + canvases + input + loop + sounds. Created when a match
// starts or resumes, destroyed when the page is left or a new match starts.
// The page shell (main.js) owns coins, saving and overlays.
import { createAudio } from "./audio.js";
import { createEngine } from "./engine.js";
import { bindGestures } from "./gesture.js";
import { COLS, VISIBLE_ROWS } from "./grid.js";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { GOAL_LINES, levelFor } from "./scoring.js";
import { createView } from "./view.js";

const MIN_CELL = 8;
// The touch pad row under the well gets its height plus a margin.
const PAD_ROOM = 1.3;

function summaryOf(state) {
  return {
    won: state.lines >= GOAL_LINES,
    score: state.score,
    lines: state.lines,
    level: levelFor(state.startLevel, state.lines)
  };
}

const cssCells = (el, name) =>
  parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

// Sizes the canvases to the room the play area has, minus the touch zones
// stage.css asks for beside the well (--tr-zone-cells) and the pad row under
// it (hidden, so 0 px, without a touch screen).
function watchSize(host, view, previews) {
  let cell = MIN_CELL;
  const pads = host.querySelector("[data-id='tetris-pads']");
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    const across = COLS + 2 * cssCells(host, "--tr-zone-cells");
    const room = (pads?.offsetHeight ?? 0) * PAD_ROOM;
    const fit = Math.min(width / across, (height - room) / VISIBLE_ROWS);
    cell = Math.max(MIN_CELL, Math.floor(fit));
    view.resize(cell);
    host.style.setProperty("--cell", `${cell}px`);
  });
  [host, ...previews].forEach((el) => observer.observe(el));
  return { cell: () => cell, stop: () => observer.disconnect() };
}

const makeActions = (engine, pause) => ({
  move: (dx) => engine.move(dx),
  cw: () => engine.rotate(1),
  ccw: () => engine.rotate(-1),
  drop: () => engine.hardDrop(),
  pause
});

function makeOnEvent(audio, onLock) {
  return (event) => {
    if (event.type === "lock") {
      audio.play(event.lines > 0 ? "clear" : "lock", event.lines);
      onLock(event);
    } else if (event.type !== "over") {
      audio.play(event.type);
    }
  };
}

// Browsers only allow sound after a gesture: unlock on the first one.
function bindUnlock(audio) {
  const life = new AbortController();
  const opts = { signal: life.signal };
  document.addEventListener("pointerdown", audio.unlock, opts);
  document.addEventListener("keydown", audio.unlock, opts);
  return () => life.abort();
}

// Wires the loop and its collaborators for one match.
function buildLoop(opts, engine, parts) {
  const { audio, input, view } = parts;
  return createLoop({
    engine,
    input,
    view,
    canPlay: opts.canPlay,
    onEvent: makeOnEvent(audio, opts.onLock),
    onHud: opts.onHud,
    onOver() {
      audio.play("over");
      opts.onEnd(summaryOf(engine.state));
    }
  });
}

// A resumed match keeps its own ghost setting.
function createBoard({ startLevel, ghost, saved, canvases }) {
  const engine = createEngine({ startLevel, ghost, saved });
  const view = createView({ ...canvases, ghost: engine.state.ghost === true });
  return { engine, view };
}

export function createGame(opts) {
  const { host, canvases, canPlay } = opts;
  const { engine, view } = createBoard(opts);
  const audio = createAudio();
  audio.setMuted(opts.muted);
  const actions = makeActions(engine, opts.onPause);
  const input = createInput({ canPlay, actions });
  const size = watchSize(host, view, [canvases.next]);
  const loop = buildLoop(opts, engine, { audio, input, view });
  const stage = host.closest("[data-id='tetris-stage']") ?? host;
  input.bind(stage);
  const gestures = { el: stage, well: canvases.board, cellSize: size.cell };
  const cleanups = [
    loop.stop,
    size.stop,
    bindGestures({ ...gestures, ...input }),
    input.destroy,
    bindUnlock(audio),
    audio.close
  ];
  opts.onHud(engine.state);
  loop.start();
  return {
    snapshot: () => (engine.state.over ? null : engine.snapshot()),
    setMuted: audio.setMuted,
    releaseKeys: input.releaseAll,
    destroy: () => cleanups.forEach((stop) => stop())
  };
}
