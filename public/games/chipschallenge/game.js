// One level mounted on the page's stage. Owns every resource it creates
// (rAF loop, ResizeObserver, listeners, AudioContext) and releases them all
// in destroy(). The 60 Hz loop runs one logic tick every 3 frames (20/s).
import { createAudio } from "./audio.js";
import { bindInput } from "./input.js";
import { createWorld } from "./level.js";
import { LEVELS } from "./levels.js";
import { createLoop } from "./loop.js";
import { createPanel } from "./panel.js";
import { render } from "./render.js";
import { loadSheet } from "./sheet.js";
import { tick } from "./step.js";
import { createSurface } from "./surface.js";

const FRAMES_PER_TICK = 3;
const END_DELAY_MS = 700;

function createRun(options) {
  const def = LEVELS[options.level - 1];
  return {
    def,
    world: createWorld(def, options.level),
    frames: 0,
    paused: false,
    ending: false,
    endTimer: 0,
    sheet: null
  };
}

function drainSounds(run, audio) {
  const { sounds } = run.world;
  sounds.forEach((name) => audio.play(name));
  sounds.length = 0;
}

function watchEnd(run, audio, options) {
  const w = run.world;
  if (run.ending || !(w.dead || w.won)) return;
  run.ending = true;
  if (w.won) audio.play("win");
  run.endTimer = setTimeout(() => {
    if (w.dead) {
      audio.play("bummer");
      options.onDeath(w.dead);
    } else {
      options.onWin(w);
    }
  }, END_DELAY_MS);
}

function updateTitleCard(card, w) {
  const show = !w.started && !w.dead && !w.won;
  if (card.hidden === !show) return;
  card.hidden = !show;
}

function createFrames(run, parts, options) {
  const { audio, input, surface, panel } = parts;
  return createLoop(
    () => {
      if (run.paused || run.ending) return;
      run.frames += 1;
      if (run.frames % FRAMES_PER_TICK !== 0) return;
      tick(run.world, input);
      drainSounds(run, audio);
      watchEnd(run, audio, options);
    },
    (seconds) => {
      render(surface.ctx, run.sheet, run.world, surface.size.zoom, seconds);
      panel.update(run.world, run.sheet);
      updateTitleCard(options.titleCard, run.world);
    }
  );
}

export function createGame(options) {
  const run = createRun(options);
  const audio = createAudio();
  const surface = createSurface(options.canvas, options.host);
  const panel = createPanel(options.panel);
  loadSheet()
    .then((sheet) => (run.sheet = sheet))
    .catch(() => options.onLoadError?.());
  const input = bindInput({
    root: options.stage,
    board: options.canvas,
    pad: options.pad,
    actions: { unlock: audio.unlock, command: options.onCommand }
  });
  const loop = createFrames(run, { audio, input, surface, panel }, options);
  audio.setMuted(options.muted);
  audio.unlock();
  loop.start();
  return {
    level: options.level,
    world: () => run.world,
    restart() {
      clearTimeout(run.endTimer);
      Object.assign(run, createRun(options), { sheet: run.sheet });
      input.clear();
      panel.reset();
    },
    setPaused(value) {
      run.paused = value;
      if (value) input.clear();
    },
    setMuted: (value) => audio.setMuted(value),
    destroy() {
      clearTimeout(run.endTimer);
      loop.stop();
      input.destroy();
      surface.disconnect();
      audio.close();
      run.sheet = null;
    }
  };
}
