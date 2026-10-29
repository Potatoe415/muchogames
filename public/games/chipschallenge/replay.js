// Exact resume of an attempt: its two seeds plus the input bits of every tic
// since Chip's first move, run-length encoded as [[bits, tics], ...]. The
// engine is deterministic, so replaying that log on a fresh level (silent,
// no rendering) rebuilds the board; the fingerprint proves it did.
import { createLevel, fingerprint, setSound } from "./engine.js";

export function logBits(log, bits) {
  const last = log[log.length - 1];
  if (last && last[0] === bits) last[1] += 1;
  else log.push([bits, 1]);
}

function replay(level, log) {
  for (const [bits, tics] of log) {
    for (let i = 0; i < tics; i += 1) {
      if (level.state !== "playing") return false;
      level.advance_tic(bits);
    }
  }
  return true;
}

function sameFingerprint(a, b) {
  return Object.keys(a).every((key) => a[key] === b[key]);
}

// The level as it was when `saved` was written, or null if the replay does
// not reproduce it (the caller then starts the attempt over).
export function restoreLevel(pack, index, saved, onSound) {
  try {
    const level = createLevel(pack, index, () => {}, saved.seeds);
    if (!replay(level, saved.inputs)) return null;
    if (!sameFingerprint(fingerprint(level), saved.check)) return null;
    setSound(level, onSound);
    return level;
  } catch {
    return null;
  }
}
