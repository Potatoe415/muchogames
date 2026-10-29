// Game rules: tile placement, the countdown -> flow -> leak -> sweep
// sequence, scoring and the end of a level. `game` bundles the mutable
// state with the audio/effects/callbacks the rules talk to.
import {
  cellAt,
  pipeCell,
  placementFor,
  tickLocks,
  unusedCells
} from "./board.js";
import { advanceFlow } from "./flow.js";
import {
  FAST_FACTOR,
  LEAK_SECONDS,
  LOCK_SECONDS,
  POINTS,
  SWEEP_SECONDS
} from "./levels.js";
import { DX, DY } from "./pieces.js";

const PLACING = new Set(["countdown", "flow"]);
const COLORS = { bonus: "#ffe14d", penalty: "#ff6b6b", debris: "#ff9f43" };

const speed = (state) => (state.fast ? FAST_FACTOR : 1);
export const canPlace = (state) => PLACING.has(state.phase);

function addScore(game, points, x, y) {
  const { state } = game;
  state.score = Math.max(0, state.score + points);
  const label = points > 0 ? `+${points}` : `${points}`;
  const color = points > 0 ? COLORS.bonus : COLORS.penalty;
  if (x !== undefined) game.effects.text(x + 0.5, y + 0.5, label, color);
}

export function tryPlace(game, x, y) {
  const { state, audio, effects } = game;
  if (!canPlace(state)) return false;
  const cell = cellAt(state.board, x, y);
  const action = placementFor(cell);
  if (!action) {
    audio.play("deny");
    return false;
  }
  const next = pipeCell(state.queue.take());
  if (action === "replace") {
    next.lock = LOCK_SECONDS;
    next.prevType = cell.type;
    addScore(game, POINTS.replace, x, y);
    effects.burst(x + 0.5, y + 0.5, COLORS.debris, 18);
    audio.play("destroy");
  } else {
    audio.play("place");
  }
  state.board.cells[y * state.board.cols + x] = next;
  return true;
}

export function toggleFast(state) {
  if (!canPlace(state)) return false;
  state.fast = !state.fast;
  return true;
}

function stepCountdown(game, dt) {
  const { state, audio } = game;
  const before = Math.ceil(state.timer);
  state.timer -= dt * speed(state);
  if (state.timer <= 0) {
    state.timer = 0;
    state.phase = "flow";
    audio.play("start");
    return;
  }
  const after = Math.ceil(state.timer);
  if (after !== before && after <= 3) audio.play("tick");
}

function onEnter(game, event) {
  const { state, audio, effects } = game;
  state.filled += 1;
  addScore(game, POINTS.tile);
  if (!event.cross) {
    audio.play("flow");
    return;
  }
  state.crosses += 1;
  addScore(game, POINTS.cross, event.x, event.y);
  effects.burst(event.x + 0.5, event.y + 0.5, COLORS.bonus, 28);
  effects.ring(event.x + 0.5, event.y + 0.5, COLORS.bonus);
  audio.play("cross");
}

function onLeak(game) {
  const { state, audio, effects } = game;
  const { x, y, dir } = state.flow.leak;
  state.phase = "leak";
  state.timer = LEAK_SECONDS;
  state.fast = false;
  effects.burst(
    x + 0.5 + DX[dir] * 0.5,
    y + 0.5 + DY[dir] * 0.5,
    "#4be04b",
    30
  );
  audio.play("leak");
}

function stepFlow(game, dt) {
  const { state } = game;
  const events = [];
  const amount = (dt * speed(state)) / state.config.secondsPerTile;
  advanceFlow(state.flow, state.board, amount, events);
  events.forEach((event) =>
    event.type === "leak" ? onLeak(game) : onEnter(game, event)
  );
}

function stepLeak(game, dt) {
  const { state } = game;
  state.timer -= dt;
  if (state.timer > 0) return;
  if (state.filled < state.config.quota) {
    state.phase = "over";
    game.audio.play("lose");
    game.onGameOver(summary(state));
    return;
  }
  state.sweep = unusedCells(state.board);
  state.phase = "sweep";
  state.timer = SWEEP_SECONDS;
}

function explode(game, index) {
  const { state, audio, effects } = game;
  const x = index % state.board.cols;
  const y = Math.floor(index / state.board.cols);
  state.board.cells[index] = { kind: "empty" };
  state.removed += 1;
  addScore(game, POINTS.unused, x, y);
  effects.burst(x + 0.5, y + 0.5, COLORS.debris, 22);
  audio.play("pop");
}

function stepSweep(game, dt) {
  const { state } = game;
  state.timer -= dt;
  if (state.timer > 0) return;
  const index = state.sweep.shift();
  if (index === undefined) {
    state.phase = "cleared";
    game.audio.play("win");
    game.onLevelCleared(summary(state));
    return;
  }
  explode(game, index);
  state.timer = SWEEP_SECONDS;
}

export function summary(state) {
  return {
    level: state.config.level,
    score: state.score,
    filled: state.filled,
    quota: state.config.quota,
    crosses: state.crosses,
    removed: state.removed,
    penalty: -state.removed * POINTS.unused
  };
}

const PHASES = {
  countdown: stepCountdown,
  flow: stepFlow,
  leak: stepLeak,
  sweep: stepSweep
};

export function stepGame(game, dt) {
  game.effects.update(dt);
  tickLocks(game.state.board, dt);
  PHASES[game.state.phase]?.(game, dt);
}
