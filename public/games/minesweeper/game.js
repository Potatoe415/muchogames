// One match: model + view + input + timer. The page shell creates it on
// match start and destroys it when the match is left or restarted.
import {
  OPEN,
  HIDDEN,
  chord,
  createBoard,
  isWon,
  minesLeft,
  reveal,
  toggleFlag
} from "./board.js";
import { bindInput } from "./input.js";
import { MAX_SECONDS, levelLayout } from "./levels.js";
import { createView } from "./view.js";

function createTimer(onTick, startMs = 0) {
  let startedAt = 0;
  let banked = startMs;
  let running = false;
  let paused = false;
  let interval = 0;

  const elapsed = () =>
    banked + (running && !paused ? performance.now() - startedAt : 0);
  const seconds = () => Math.min(MAX_SECONDS, Math.floor(elapsed() / 1000));

  function resume() {
    startedAt = performance.now();
    interval = setInterval(() => onTick(seconds()), 250);
  }

  function halt() {
    banked = elapsed();
    clearInterval(interval);
  }

  return {
    elapsed,
    seconds,
    start() {
      running = true;
      if (!paused) resume();
    },
    setPaused(value) {
      if (value === paused) return;
      if (running && value) halt();
      paused = value;
      if (running && !value) resume();
    },
    stop() {
      if (running && !paused) halt();
      running = false;
    }
  };
}

// `saved` ({ board, elapsed }) resumes a stored match instead of a new one;
// its board keeps the saved size and orientation.
export function createGame(options) {
  const { host, level, portrait, saved, t, onHud, onEnd, onMove } = options;
  const board = saved?.board ?? createBoard(levelLayout(level, portrait));
  const view = createView({ host, board, t });
  const timer = createTimer(() => hud(), saved?.elapsed);
  let flagMode = false;
  let over = false;
  let ticking = false;

  // A resumed match comes back paused: its clock waits for the next move.
  function tick() {
    if (ticking || !board.placed) return;
    ticking = true;
    timer.start();
  }

  function hud(face = "playing") {
    onHud({ minesLeft: minesLeft(board), seconds: timer.seconds(), face });
  }

  function settle(changed) {
    view.update(changed);
    const won = isWon(board);
    if (!won && board.exploded < 0) {
      hud();
      return onMove();
    }
    over = true;
    timer.stop();
    view.revealEnd(won);
    hud(won ? "won" : "lost");
    onEnd({ won, seconds: Math.max(1, timer.seconds()) });
  }

  function onPrimary(index) {
    if (over) return;
    const state = board.state[index];
    if (state === OPEN) {
      tick();
      return settle(chord(board, index));
    }
    if (flagMode) return onFlag(index);
    if (state !== HIDDEN) return;
    const changed = reveal(board, index);
    tick();
    settle(changed);
  }

  function onFlag(index) {
    if (over || !toggleFlag(board, index)) return;
    tick();
    view.update([index]);
    hud();
    onMove();
  }

  const unbind = bindInput(host, { cols: board.cols, onPrimary, onFlag });
  hud();

  return {
    snapshot: () => (over ? null : { level, elapsed: timer.elapsed(), board }),
    setPaused: (value) => timer.setPaused(value),
    setFlagMode(value) {
      flagMode = value;
    },
    relabel: () => view.relabel(),
    destroy() {
      timer.stop();
      unbind();
      view.destroy();
    }
  };
}
