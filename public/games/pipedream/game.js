// One Pipe Dream match mounted on the page's stage. Owns every resource it
// creates (rAF loop, ResizeObserver, listeners, AudioContext) and releases
// them all in destroy().
import { createAudio } from "./audio.js";
import { createBoard } from "./board.js";
import { createEffects } from "./effects.js";
import { createFlow } from "./flow.js";
import { createHud } from "./hud.js";
import { bindInput } from "./input.js";
import {
  cellFromPoint,
  computeLayout,
  createSurface,
  isPortrait
} from "./layout.js";
import { GRID_LONG, GRID_SHORT, QUEUE_SIZE, levelConfig } from "./levels.js";
import { createLoop } from "./loop.js";
import { createQueue } from "./pieces.js";
import { render } from "./render.js";
import { canPlace, stepGame, summary, toggleFast, tryPlace } from "./rules.js";

function hudView(state) {
  const counting = state.phase === "countdown";
  return {
    score: String(state.score),
    level: String(state.config.level),
    quota: String(Math.max(0, state.config.quota - state.filled)),
    countdown: counting ? String(Math.ceil(state.timer)) : "—",
    urgent: counting && state.timer <= 3,
    fast: state.fast,
    fastEnabled: canPlace(state)
  };
}

export function createGame({
  stage,
  canvas,
  host,
  muted,
  saved,
  onLevelCleared,
  onGameOver,
  onMove
}) {
  const audio = createAudio();
  const hud = createHud(stage);
  const state = { score: 0, paused: false };
  const game = {
    state,
    audio,
    effects: createEffects(),
    onLevelCleared,
    onGameOver
  };
  let size = { width: 1, height: 1 };
  let layout = null;
  let hover = null;

  function relayout() {
    if (!state.board) return;
    const { cols, rows } = state.board;
    layout = computeLayout(size.width, size.height, cols, rows);
  }

  const surface = createSurface(canvas, host, (next) => {
    size = next;
    relayout();
  });

  function startLevel(level) {
    const config = levelConfig(level);
    const portrait = isPortrait(size.width, size.height);
    const cols = portrait ? GRID_SHORT : GRID_LONG;
    const rows = portrait ? GRID_LONG : GRID_SHORT;
    const board = createBoard(cols, rows, config);
    Object.assign(state, {
      config,
      board,
      queue: createQueue(QUEUE_SIZE),
      flow: createFlow(board),
      phase: "countdown",
      timer: config.countdown,
      fast: false,
      filled: 0,
      crosses: 0,
      removed: 0,
      sweep: []
    });
    hover = null;
    relayout();
  }

  function restore({ level, queue, ...match }) {
    Object.assign(state, match, {
      config: levelConfig(level),
      queue: createQueue(QUEUE_SIZE, Math.random, queue)
    });
    relayout();
  }

  function moved(done) {
    if (done) onMove();
    return done;
  }

  const loop = createLoop(
    (dt) => {
      if (!state.paused) stepGame(game, dt);
    },
    (time) => {
      const live = canPlace(state) && !state.paused;
      const view = {
        state,
        effects: game.effects,
        hover,
        time,
        canPlace: live
      };
      render(surface.ctx, layout, view);
      hud.update(hudView(state));
    }
  );

  const unbind = bindInput({
    canvas,
    root: stage,
    fastButton: hud.fastButton,
    toCell: (px, py) => cellFromPoint(layout, px, py),
    actions: {
      unlock: audio.unlock,
      place: (x, y) => moved(!state.paused && tryPlace(game, x, y)),
      hover: (cell) => (hover = cell),
      fast: () => moved(!state.paused && toggleFast(state))
    }
  });

  audio.setMuted(muted);
  audio.unlock();
  if (saved) restore(saved);
  else startLevel(1);
  loop.start();

  return {
    nextLevel: () => startLevel(state.config.level + 1),
    // The live state to save, or null once the match is over.
    current: () => (state.phase === "over" ? null : state),
    summary: () => summary(state),
    setPaused: (value) => (state.paused = value),
    setMuted: (value) => audio.setMuted(value),
    destroy() {
      loop.stop();
      unbind();
      surface.disconnect();
      audio.close();
    }
  };
}
