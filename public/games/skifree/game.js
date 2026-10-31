// One SkiFree run mounted on the page's stage. Owns every resource it
// creates (rAF loop, ResizeObserver, listeners, AudioContext) and releases
// them all in destroy().
import { createAudio } from "./audio.js";
import { airSpin, climb, jump, pointDown, steer, turn } from "./controls.js";
import { createCourse } from "./course.js";
import { createHud, hudView } from "./hud.js";
import { bindInput } from "./input.js";
import { createLoop } from "./loop.js";
import { render } from "./render.js";
import { encodeRun } from "./save.js";
import { createSkier } from "./skier.js";
import { loadSheet } from "./sprites.js";
import { followCamera, stepGame } from "./step.js";
import { createSurface } from "./surface.js";
import { createWorld, updateWorld } from "./world.js";
import { createYeti } from "./yeti.js";

const SKIER_MID = 16;
const COMMANDS = {
  left: (game) => turn(game, -1),
  right: (game) => turn(game, 1),
  up: climb,
  down: pointDown,
  jump
};

function freshRun() {
  const course = createCourse();
  return {
    skier: createSkier(),
    course,
    world: createWorld(course),
    yeti: createYeti(),
    time: 0,
    turbo: false
  };
}

function createState(options, audio) {
  return {
    ...(options.saved ?? freshRun()),
    view: { x: 0, y: 0, w: 1, h: 1 },
    paused: false,
    audio,
    onCourse: options.onCourse,
    onEaten: options.onEaten
  };
}

function createActions(game, options) {
  const playable = () => !game.paused && game.skier.mode !== "eaten";
  const setTurbo = (on) => {
    game.turbo = on;
    options.buttons.turbo.setAttribute("aria-pressed", String(on));
    game.audio.play(on ? "turboOn" : "turboOff");
  };
  const command = (name) => {
    if (name === "pause") return options.onPauseKey();
    if (name === "restart") return options.onRestartKey();
    if (!playable()) return;
    if (name === "turbo") return setTurbo(!game.turbo);
    COMMANDS[name]?.(game);
  };
  return {
    unlock: game.audio.unlock,
    command,
    steer: (dir) => playable() && steer(game, dir),
    airSpin: (sign) => playable() && airSpin(game, sign)
  };
}

function skierLocator(game, surface) {
  return () => {
    const { zoom, dpr } = surface.size;
    const s = game.skier;
    const scale = zoom / dpr;
    return {
      x: (s.x - game.view.x) * scale,
      y: (s.y - s.z - SKIER_MID - game.view.y) * scale
    };
  };
}

function watchSurface(game, options) {
  return createSurface(options.canvas, options.host, (size) => {
    game.view.w = size.viewW;
    game.view.h = size.viewH;
    followCamera(game);
    updateWorld(game.world, game.view);
  });
}

function createFrames(game, surface, options) {
  const hud = createHud(options.stage);
  const sheet = { image: null };
  loadSheet()
    .then((image) => (sheet.image = image))
    .catch(() => options.onLoadError?.());
  const loop = createLoop(
    (dt) => game.paused || stepGame(game, dt),
    () => {
      render(surface.ctx, sheet.image, game, surface.size);
      hud.update(hudView(game, options.t));
    }
  );
  return { loop, sheet };
}

export function createGame(options) {
  const audio = createAudio();
  const game = createState(options, audio);
  const surface = watchSurface(game, options);
  const { loop, sheet } = createFrames(game, surface, options);
  const unbind = bindInput({
    canvas: options.canvas,
    root: options.stage,
    buttons: options.buttons,
    skierAt: skierLocator(game, surface),
    actions: createActions(game, options)
  });
  options.buttons.turbo.setAttribute("aria-pressed", String(game.turbo));
  audio.setMuted(options.muted);
  audio.unlock();
  loop.start();
  return {
    setPaused(value) {
      game.paused = value;
      if (value) audio.setGlide(0);
    },
    setMuted: (value) => audio.setMuted(value),
    summary: () => ({ skier: game.skier, time: game.time }),
    snapshot: () => encodeRun(game),
    destroy() {
      loop.stop();
      unbind();
      surface.disconnect();
      audio.close();
      sheet.image = null;
    }
  };
}
