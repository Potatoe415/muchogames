// One match: the game shows the sequence, the player repeats it, one
// mistake ends it. The page shell (main.js) owns screens, saving and the
// match lifecycle.
import { createBoard } from "./board.js";
import { check, extend, timing } from "./rules.js";

const LEAD_MS = 800;
const PRESS_MS = 260;
const END_MS = 1300;

export function createGame(options) {
  const { board, audio, saved, canPlay, onHud, onEnd } = options;
  // A saved match restarts its current round: the sequence plays again.
  const state = {
    sequence: saved ? [...saved.sequence] : extend([]),
    step: 0,
    phase: "show"
  };
  const pads = createBoard({ board, onPress: press });
  let timers = [];

  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const score = () => state.sequence.length - 1;

  function hud() {
    onHud({ score: score(), phase: state.phase });
  }

  function flash(pad, ms) {
    pads.light(pad, ms);
    audio.pad(pad, ms / 1000);
  }

  function show() {
    state.phase = "show";
    state.step = 0;
    pads.setWaiting(false);
    hud();
    const { on, gap } = timing(state.sequence.length);
    state.sequence.forEach((pad, i) => {
      later(LEAD_MS + i * (on + gap), () => flash(pad, on));
    });
    later(LEAD_MS + state.sequence.length * (on + gap) - gap, listen);
  }

  function listen() {
    state.phase = "input";
    pads.setWaiting(true);
    hud();
  }

  function lose(pad) {
    state.phase = "over";
    pads.setWaiting(false);
    audio.wrong();
    pads.light(pad, END_MS);
    pads.light(state.sequence[state.step], END_MS);
    hud();
    later(END_MS, () => onEnd({ score: score() }));
  }

  function press(pad) {
    audio.unlock();
    if (state.phase !== "input" || !canPlay()) return;
    const result = check(state.sequence, state.step, pad);
    if (result === "wrong") return lose(pad);
    flash(pad, PRESS_MS);
    state.step += 1;
    if (result === "next") return;
    state.phase = "show";
    state.sequence = extend(state.sequence);
    pads.setWaiting(false);
    hud();
    later(PRESS_MS, show);
  }

  show();

  return {
    // Plain values for save.js; null once the match is over.
    snapshot: () =>
      state.phase === "over" ? null : { sequence: [...state.sequence] },
    destroy() {
      timers.forEach(clearTimeout);
      timers = [];
      pads.destroy();
    }
  };
}
