// One match: engine + canvases + input + loop + sounds. Created when a match
// starts or resumes, destroyed when the page is left or a new match starts.
// The page shell (main.js) owns coins, saving and overlays.
import { createAudio } from "./audio.js";
import { createEngine } from "./engine.js";
import { bindGestures } from "./gesture.js";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { GOAL_LINES, levelFor } from "./scoring.js";
import { createView } from "./view.js";

// The play row is 10 well columns + two 3-cell side columns + gaps.
const ROW_CELLS = 16.8;
const ROW_ROWS = 20;
const MIN_CELL = 8;

function summaryOf(state) {
  return {
    won: state.lines >= GOAL_LINES,
    score: state.score,
    lines: state.lines,
    level: levelFor(state.startLevel, state.lines)
  };
}

// Sizes the canvases to the room the play area has.
function watchSize(host, view) {
  let cell = MIN_CELL;
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    const fit = Math.min(width / ROW_CELLS, height / ROW_ROWS);
    cell = Math.max(MIN_CELL, Math.floor(fit));
    view.resize(cell);
    host.style.setProperty("--cell", `${cell}px`);
  });
  observer.observe(host);
  return { cell: () => cell, stop: () => observer.disconnect() };
}

const makeActions = (engine, pause) => ({
  move: (dx) => engine.move(dx),
  cw: () => engine.rotate(1),
  ccw: () => engine.rotate(-1),
  hold: () => engine.hold(),
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

export function createGame(opts) {
  const { host, canvases, canPlay } = opts;
  const engine = createEngine({ startLevel: opts.startLevel, saved: opts.saved });
  const view = createView(canvases);
  const audio = createAudio();
  audio.setMuted(opts.muted);
  const actions = makeActions(engine, opts.onPause);
  const input = createInput({ canPlay, actions });
  const size = watchSize(host, view);
  const loop = buildLoop(opts, engine, { audio, input, view });
  input.bind(host.closest("[data-id='tetris-stage']") ?? host);
  const gestures = { el: canvases.board, cellSize: size.cell, ...input };
  const cleanups = [
    loop.stop,
    size.stop,
    bindGestures(gestures),
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
