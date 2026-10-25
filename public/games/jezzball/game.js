// One JezzBall match mounted on the page's stage. Owns every resource it
// creates (rAF loop, ResizeObserver, listeners, AudioContext, field cache)
// and releases them all in destroy().
import { createAudio } from "./audio.js";
import { spawnBalls } from "./balls.js";
import { createFieldCache } from "./draw-field.js";
import { createEffects } from "./effects.js";
import { createGrid } from "./grid.js";
import { createHud } from "./hud.js";
import { bindInput } from "./input.js";
import {
  cellFromPoint,
  computeLayout,
  createSurface,
  isPortrait
} from "./layout.js";
import {
  GRID_LONG,
  GRID_SHORT,
  TARGET_PERCENT,
  URGENT_SECONDS,
  levelConfig
} from "./levels.js";
import { createLoop } from "./loop.js";
import { render } from "./render.js";
import {
  canBuild,
  stepGame,
  toggleAxis,
  tryBuild,
  twoFingerToggle
} from "./rules.js";

function hudView(state, best) {
  const seconds = Math.ceil(state.timer);
  return {
    level: String(state.config.level),
    lives: String(Math.max(0, state.lives)),
    area: `${Math.floor(state.percent)}% / ${TARGET_PERCENT}%`,
    time: String(seconds),
    urgent: state.phase === "play" && seconds <= URGENT_SECONDS,
    score: String(state.score),
    best: String(Math.max(best, state.score)),
    axis: state.axis
  };
}

export function createGame(options) {
  const { stage, canvas, host, muted, best, swipe } = options;
  const audio = createAudio();
  const hud = createHud(stage, canvas);
  const field = createFieldCache();
  const state = { score: 0, axis: "h", paused: false, flash: 0, swipe };
  const game = {
    state,
    audio,
    effects: createEffects(),
    onLevelCleared: options.onLevelCleared,
    onGameOver: options.onGameOver
  };
  let size = { width: 1, height: 1, dpr: 1 };
  let layout = null;
  let hover = null;

  function relayout() {
    if (!state.grid) return;
    layout = computeLayout(size, state.grid.cols, state.grid.rows);
  }

  const surface = createSurface(canvas, host, (next) => {
    size = next;
    relayout();
  });

  function startLevel(level) {
    const config = levelConfig(level);
    const portrait = isPortrait(size.width, size.height);
    const grid = portrait
      ? createGrid(GRID_SHORT, GRID_LONG)
      : createGrid(GRID_LONG, GRID_SHORT);
    Object.assign(state, {
      config,
      grid,
      balls: spawnBalls(grid, config.balls),
      walls: [],
      lives: config.lives,
      timer: config.time,
      percent: 0,
      percentBonus: 0,
      timeBonus: 0,
      flash: 0,
      phase: "play"
    });
    hover = null;
    relayout();
  }

  const loop = createLoop(
    (dt) => {
      if (!state.paused) stepGame(game, dt);
    },
    (time) => {
      const view = {
        state,
        effects: game.effects,
        field,
        hover,
        time,
        canBuild: canBuild(state)
      };
      render(surface.ctx, layout, view);
      hud.update(hudView(state, best));
    }
  );

  const unbind = bindInput({
    canvas,
    root: stage,
    axisButton: hud.axisButton,
    toCell: (px, py) => cellFromPoint(layout, px, py),
    actions: {
      unlock: audio.unlock,
      build: (x, y, axis, dir) => tryBuild(game, x, y, axis, dir),
      swipe: () => state.swipe,
      toggle: () => toggleAxis(game),
      twoFinger: () => twoFingerToggle(game),
      hover: (cell) => (hover = cell)
    }
  });

  audio.setMuted(muted);
  audio.unlock();
  startLevel(1);
  loop.start();

  return {
    nextLevel: () => startLevel(state.config.level + 1),
    setPaused: (value) => (state.paused = value),
    setMuted: (value) => audio.setMuted(value),
    setSwipe: (value) => (state.swipe = value),
    destroy() {
      loop.stop();
      unbind();
      surface.disconnect();
      field.release();
      audio.close();
    }
  };
}
