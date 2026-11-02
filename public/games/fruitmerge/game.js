// One match: owns the world, loop, canvas sizing, input, sound and effects.
// createGame(...) → { setPaused, setMuted, sweep, undo, snapshot, destroy }.
import { createAudio } from "./audio.js";
import { createEffects } from "./effects.js";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { EXTENT, WALL, createRenderer, createView } from "./render.js";
import { createSprites } from "./sprites.js";
import * as rules from "./world.js";

const MAX_PIXEL_RATIO = 3;

function hudOf(world) {
  return {
    score: world.score,
    next: world.queue.slice(1),
    sweeps: world.sweeps,
    undos: world.undos,
    canSweep: rules.canSweep(world),
    canUndo: rules.canUndo(world),
    danger: world.danger > 0
  };
}

export function createGame({ canvas, host, saved, muted, onHud, onEnd }) {
  const world = rules.createWorld(saved);
  const sprites = createSprites();
  const renderer = createRenderer(canvas.getContext("2d"), sprites);
  const effects = createEffects();
  const audio = createAudio();
  let view = createView(1);
  let paused = false;
  let ended = false;
  let hudKey = "";
  audio.setMuted(muted);

  function report() {
    const hud = hudOf(world);
    const key = JSON.stringify(hud);
    if (key === hudKey) return;
    hudKey = key;
    onHud(hud);
  }

  const draw = (time) => renderer.draw(view, world, effects, time);

  function fit() {
    const scale = Math.min(
      host.clientWidth / EXTENT.w,
      host.clientHeight / EXTENT.h
    );
    if (!(scale > 0)) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.style.width = `${Math.floor(EXTENT.w * scale)}px`;
    canvas.style.height = `${Math.floor(EXTENT.h * scale)}px`;
    canvas.width = Math.round(Math.floor(EXTENT.w * scale) * ratio);
    canvas.height = Math.round(Math.floor(EXTENT.h * scale) * ratio);
    view = createView(canvas.width);
    renderer.resize();
    draw(performance.now() / 1000);
  }

  function end() {
    ended = true;
    loop.stop();
    audio.play("over");
    onEnd({ score: world.score, top: world.top, merges: world.merges });
  }

  function handle(event) {
    if (event.type === "over") return end();
    effects.merge(event);
    audio.play(event.type === "pair" ? "pair" : "merge", event.level);
  }

  function update(dt) {
    input.update(dt);
    rules.stepWorld(world, dt).forEach(handle);
    effects.update(dt);
    if (world.danger > 0 && !ended) audio.play("tick");
    report();
  }

  const loop = createLoop(update, draw);
  const input = createInput(canvas, {
    toBoxX: (fraction) => fraction * EXTENT.w - WALL,
    aim: (x) => rules.setAim(world, x),
    nudge: (dx) => rules.setAim(world, world.aim + dx),
    drop: () => {
      if (paused || ended || !rules.drop(world)) return;
      audio.play("drop");
      report();
    },
    wake: () => audio.unlock()
  });
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();
  report();
  loop.start();

  return {
    setPaused(value) {
      paused = value;
      if (paused || ended) loop.stop();
      else loop.start();
    },
    setMuted: (value) => audio.setMuted(value),
    sweep() {
      audio.unlock();
      const swept = rules.sweep(world);
      if (!swept.length) return;
      swept.forEach((body) => effects.puff(body));
      audio.play("sweep");
      report();
      draw(performance.now() / 1000);
    },
    undo() {
      audio.unlock();
      if (!rules.undo(world)) return;
      audio.play("undo");
      report();
      draw(performance.now() / 1000);
    },
    snapshot: () => (ended ? null : world),
    destroy() {
      loop.stop();
      input.destroy();
      observer.disconnect();
      audio.close();
    }
  };
}
