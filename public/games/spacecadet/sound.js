// Mute toggle: suspends the SDL2 AudioContext, remembered across visits.
const MUTE_KEY = "spacecadet-muted";

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted = readMuted();
// Silent while the Game Dashboard covers the table (not remembered).
let silenced = false;

export const isMuted = () => muted;

export function setSilenced(value) {
  silenced = value;
  syncAudio();
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable: the choice only lasts for this visit.
  }
  syncAudio();
}

export function syncAudio() {
  const sdl = window.Module?.SDL2;
  if (!sdl) return;
  const quiet = muted || silenced;
  [sdl.audioContext, sdl.audio?.context, sdl.capture?.audioContext].forEach(
    (ctx) => {
      if (quiet && ctx?.state === "running") ctx.suspend();
      if (!quiet && ctx?.state === "suspended") ctx.resume();
    }
  );
}
