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

export const isMuted = () => muted;

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
  [sdl.audioContext, sdl.audio?.context, sdl.capture?.audioContext].forEach(
    (ctx) => {
      if (muted && ctx?.state === "running") ctx.suspend();
      if (!muted && ctx?.state === "suspended") ctx.resume();
    }
  );
}
