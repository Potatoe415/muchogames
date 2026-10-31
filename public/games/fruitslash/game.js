// One match: wires the world, the blade, the input, the scoring, the
// effects and the sounds around the fixed-step loop. main.js owns the page.
import { createAudio } from "./audio.js";
import { createBlade } from "./blade.js";
import { createEffects } from "./effects.js";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { createRenderer } from "./render.js";
import { createScoring } from "./scoring.js";
import { createWorld, stepWorld } from "./world.js";

const seconds = () => performance.now() / 1000;

// The blade as the input sees it: cuts only while the match runs.
function createCutter(blade, scoring, audio, live) {
  return {
    start(p) {
      audio.unlock();
      if (live()) blade.start(p.x, p.y, seconds());
    },
    move(p) {
      const segment = live() ? blade.add(p.x, p.y, seconds()) : null;
      if (segment) scoring.cutAlong(segment);
    },
    end() {
      blade.end();
      scoring.endStroke();
    }
  };
}

function announceStart(effects, audio, size, t) {
  effects.text(size.w / 2, size.h * 0.45, t("go"), "#ffffff", 52);
  audio.play("go");
}

export function createGame(options) {
  const { canvas, host, saved, t, onHud, onEnd } = options;
  const world = saved || createWorld(options.mode, options.theme);
  const renderer = createRenderer(canvas);
  const { size } = renderer;
  const effects = createEffects();
  const blade = createBlade();
  const audio = createAudio();
  const state = { paused: false, ended: false, whole: 0 };
  const hud = () => onHud({ score: world.score, timeLeft: world.timeLeft });
  const scoring = createScoring({
    world,
    size,
    effects,
    audio,
    t,
    onChange: hud
  });
  const live = () => !state.paused && !state.ended;
  const cutter = createCutter(blade, scoring, audio, live);
  const input = createInput(canvas, cutter);

  function tickClock() {
    const whole = Math.ceil(world.timeLeft);
    if (whole === state.whole) return;
    state.whole = whole;
    hud();
    if (whole > 0 && whole <= 5) audio.play("tick");
  }

  function finishMatch() {
    state.ended = true;
    scoring.endStroke();
    blade.clear();
    audio.play("end");
    const { mode, theme, score, sliced, bestCombo } = world;
    onEnd({ mode, theme, score, sliced, bestCombo });
  }

  function update(dt) {
    if (!live()) return;
    input.update(dt, size);
    stepWorld(world, dt);
    effects.update(dt);
    scoring.update();
    tickClock();
    if (world.timeLeft <= 0) finishMatch();
  }

  const loop = createLoop(update, (now) => {
    blade.prune(now);
    renderer.draw({ world, effects, blade, cursor: input.cursor }, now);
  });
  const observer = new ResizeObserver(() => renderer.resize());
  observer.observe(host);
  audio.setMuted(options.muted);
  audio.unlock();
  if (!saved) announceStart(effects, audio, size, t);
  hud();
  loop.start();

  return {
    setPaused(value) {
      state.paused = value;
      if (value) cutter.end();
    },
    setMuted: (value) => audio.setMuted(value),
    // The match to save, or null once it has ended.
    snapshot: () => (state.ended ? null : world),
    destroy() {
      loop.stop();
      input.destroy();
      observer.disconnect();
      audio.close();
    }
  };
}
