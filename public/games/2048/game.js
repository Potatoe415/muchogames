// One match: state, moves, undo, win/end detection, sounds. The page shell
// (main.js) owns overlays, saving and the match lifecycle.
import { createAudio } from "./audio.js";
import {
  GOAL,
  canMove,
  emptyCells,
  fromValues,
  maxValue,
  move,
  spawn,
  toValues
} from "./board.js";
import { createInput } from "./input.js";
import { createView } from "./view.js";

export const UNDOS = 3;
const START_TILES = 2;

function freshState() {
  const cells = emptyCells();
  for (let i = 0; i < START_TILES; i++) spawn(cells);
  return { cells, score: 0, undos: UNDOS, won: false, undo: null };
}

const restoreState = (saved) => ({ ...saved, cells: fromValues(saved.cells) });

export function createGame(options) {
  const { board, host, saved, muted, canPlay, onHud, onWin, onEnd } = options;
  const state = saved ? restoreState(saved) : freshState();
  let over = false;
  const audio = createAudio();
  audio.setMuted(muted);
  const view = createView(board, host);
  const input = createInput({
    board,
    onMove: play,
    enabled: () => !over && canPlay()
  });

  const summary = () => ({
    score: state.score,
    top: maxValue(state.cells),
    won: state.won
  });

  function hud(gained) {
    onHud({
      score: state.score,
      undos: state.undos,
      canUndo: !over && state.undos > 0 && state.undo !== null,
      gained
    });
  }

  function end() {
    over = true;
    hud(0);
    onEnd(summary());
  }

  function settle() {
    const reached = maxValue(state.cells) >= GOAL;
    if (!canMove(state.cells)) {
      state.won = state.won || reached;
      audio.play("over");
      return end();
    }
    if (reached && !state.won) {
      state.won = true;
      audio.play("win");
      onWin();
    }
  }

  function play(dir) {
    audio.unlock();
    const result = move(state.cells, dir);
    if (!result.moved) return;
    state.undo = { cells: toValues(state.cells), score: state.score };
    state.cells = result.cells;
    state.score += result.gained;
    const spawned = spawn(state.cells);
    view.render(state.cells, { ...result, spawned });
    if (result.top) audio.play("merge", Math.log2(result.top) - 2);
    else audio.play("slide");
    hud(result.gained);
    settle();
  }

  function undo() {
    if (over || state.undos === 0 || !state.undo) return;
    audio.unlock();
    state.cells = fromValues(state.undo.cells);
    state.score = state.undo.score;
    state.undo = null;
    state.undos -= 1;
    view.render(state.cells, { instant: true });
    audio.play("undo");
    hud(0);
  }

  view.render(state.cells, { instant: true });
  hud(0);

  return {
    undo,
    // Ends the match on purpose (after reaching 2048).
    finish: () => !over && end(),
    snapshot: () =>
      over
        ? null
        : {
            cells: toValues(state.cells),
            score: state.score,
            undos: state.undos,
            won: state.won,
            undo: state.undo
          },
    setMuted: (value) => audio.setMuted(value),
    destroy() {
      input.destroy();
      view.destroy();
      audio.close();
    }
  };
}
