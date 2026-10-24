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

function createTimer(onTick) {
  let startedAt = 0;
  let banked = 0;
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

export function createGame({ host, level, portrait, t, onHud, onEnd }) {
  const board = createBoard(levelLayout(level, portrait));
  const view = createView({ host, board, t });
  const timer = createTimer(() => hud());
  let flagMode = false;
  let over = false;

  function hud(face = "playing") {
    onHud({ minesLeft: minesLeft(board), seconds: timer.seconds(), face });
  }

  function settle(changed) {
    view.update(changed);
    const won = isWon(board);
    if (!won && board.exploded < 0) return hud();
    over = true;
    timer.stop();
    view.revealEnd(won);
    hud(won ? "won" : "lost");
    onEnd({ won, seconds: Math.max(1, timer.seconds()) });
  }

  function onPrimary(index) {
    if (over) return;
    const state = board.state[index];
    if (state === OPEN) return settle(chord(board, index));
    if (flagMode) return onFlag(index);
    if (state !== HIDDEN) return;
    const firstReveal = !board.placed;
    const changed = reveal(board, index);
    if (firstReveal) timer.start();
    settle(changed);
  }

  function onFlag(index) {
    if (over || !toggleFlag(board, index)) return;
    view.update([index]);
    hud();
  }

  const unbind = bindInput(host, { onPrimary, onFlag });
  hud();

  return {
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
