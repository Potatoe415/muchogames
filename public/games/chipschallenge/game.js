// One level mounted on the page's stage. Owns every resource it creates
// (rAF loop, ResizeObserver, listeners, AudioContext) and releases them all
// in destroy(). The 60 Hz loop advances the rules engine one tic every 3
// frames (20/s); nothing moves until Chip's first move.
import { createAudio } from "./audio.js";
import {
  createLevel,
  deathReason,
  DIR_INDEX,
  fingerprint,
  levelSeeds,
  status
} from "./engine.js";
import { bindInput } from "./input.js";
import { levelPack } from "./levels.js";
import { createLoop } from "./loop.js";
import { createPanel } from "./panel.js";
import { render } from "./render.js";
import { logBits, restoreLevel } from "./replay.js";
import { loadSheet } from "./sheet.js";
import { createSurface } from "./surface.js";

const FRAMES_PER_TIC = 3;
const END_DELAY_MS = 700;

function createRun(options, audio, saved = null) {
  const index = options.level - 1;
  const restored = saved && restoreLevel(levelPack(), index, saved, audio.play);
  const level = restored || createLevel(levelPack(), index, audio.play);
  const { cell, direction } = level.player;
  const log = restored ? saved.inputs.map(([bits, tics]) => [bits, tics]) : [];
  return {
    level,
    seeds: restored ? saved.seeds : levelSeeds(level),
    log,
    chip: { x: cell.x, y: cell.y, dir: DIR_INDEX[direction] ?? 2 },
    frames: 0,
    started: log.length > 0,
    paused: false,
    ending: false,
    endTimer: 0
  };
}

function trackChip(run) {
  const player = run.level.player;
  if (!player?.cell) return false;
  const moved = player.cell.x !== run.chip.x || player.cell.y !== run.chip.y;
  run.chip.x = player.cell.x;
  run.chip.y = player.cell.y;
  run.chip.dir = DIR_INDEX[player.direction] ?? run.chip.dir;
  return moved;
}

function tic(run, input, audio) {
  const { level } = run;
  if (level.state !== "playing") return;
  const bits = input.bits();
  if (!run.started && !bits) return;
  run.started = true;
  const accept = level.can_accept_input();
  level.advance_tic(bits);
  logBits(run.log, bits);
  if (accept) input.clearTaps();
  const moved = trackChip(run);
  if (!accept || !bits || level.state !== "playing") return;
  if (moved) audio.play("step");
  else if (!level.player.movement_cooldown) audio.play("oof");
}

function watchEnd(run, audio, options) {
  const { level } = run;
  if (run.ending || level.state === "playing") return;
  run.ending = true;
  if (level.state === "success") audio.play("win");
  run.endTimer = setTimeout(() => {
    if (level.state === "success") options.onWin(status(level, options.level));
    else {
      audio.play("bummer");
      options.onDeath(deathReason(level));
    }
  }, END_DELAY_MS);
}

function frameView(run) {
  const { level, chip } = run;
  return {
    level,
    chip,
    dead: deathReason(level),
    won: level.state === "success"
  };
}

function createFrames(run, parts, options) {
  const { audio, input, surface, panel, sheet } = parts;
  return createLoop(
    () => {
      const r = run.current;
      if (r.paused || r.ending) return;
      r.frames += 1;
      if (r.frames % FRAMES_PER_TIC !== 0) return;
      tic(r, input, audio);
      if (r.started) options.onTic?.();
      watchEnd(r, audio, options);
    },
    (seconds) => {
      const r = run.current;
      render(
        surface.ctx,
        sheet.image,
        frameView(r),
        surface.size.zoom,
        seconds
      );
      panel.update(status(r.level, options.level), sheet.image);
      options.titleCard.hidden = r.started || r.ending;
    }
  );
}

export function createGame(options) {
  const audio = createAudio();
  const run = { current: createRun(options, audio, options.saved) };
  const surface = createSurface(options.canvas, options.host);
  const panel = createPanel(options.panel);
  const sheet = { image: null };
  loadSheet()
    .then((image) => (sheet.image = image))
    .catch(() => options.onLoadError?.());
  const input = bindInput({
    root: options.stage,
    board: options.canvas,
    pad: options.pad,
    actions: { unlock: audio.unlock, command: options.onCommand }
  });
  const parts = { audio, input, surface, panel, sheet };
  const loop = createFrames(run, parts, options);
  audio.setMuted(options.muted);
  audio.unlock();
  loop.start();
  return {
    level: options.level,
    progress: () => ({
      started: run.current.started,
      over: run.current.level.state !== "playing"
    }),
    snapshot: () => ({
      seeds: run.current.seeds,
      inputs: run.current.log,
      check: fingerprint(run.current.level)
    }),
    restart() {
      clearTimeout(run.current.endTimer);
      run.current = createRun(options, audio);
      input.clear();
      panel.reset();
    },
    setPaused(value) {
      run.current.paused = value;
      if (value) input.clear();
    },
    setMuted: (value) => audio.setMuted(value),
    destroy() {
      clearTimeout(run.current.endTimer);
      loop.stop();
      input.destroy();
      surface.disconnect();
      audio.close();
      sheet.image = null;
    }
  };
}
