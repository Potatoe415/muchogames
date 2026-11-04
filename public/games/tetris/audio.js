// Sound player: the context is created on the first gesture (unlock), after
// which sounds play unless muted. Fast repeats of move / rotate are thinned.
import { openAudio } from "./synth.js";

const MIN_GAP = { move: 0.04, rotate: 0.05 };

// Remembers when each sound last played; false = too soon, skip it.
function createThrottle() {
  const lastPlayed = {};
  return (name, now) => {
    const gap = MIN_GAP[name];
    if (!gap) return true;
    if (now - (lastPlayed[name] ?? -1) < gap) return false;
    lastPlayed[name] = now;
    return true;
  };
}

export function createAudio() {
  let audio = null;
  let muted = false;
  const allowed = createThrottle();

  return {
    unlock() {
      audio ??= openAudio();
      if (audio?.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
    },
    play(name, arg) {
      if (!audio || muted || audio.ctx.state !== "running") return;
      if (allowed(name, audio.ctx.currentTime)) audio.sounds[name]?.(arg);
    },
    setMuted(value) {
      muted = value;
    },
    close() {
      audio?.ctx.close().catch(() => {});
      audio = null;
    }
  };
}
