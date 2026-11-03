// Soft synthesized sounds (Web Audio API, no files), same pattern as Fusion
// de fruits'. Gentle attacks and a pentatonic scale keep it calm. The
// context is created on the first gesture (unlock).
const MASTER_VOLUME = 0.35;
const ATTACK = 0.015;
const MIN_GAP = { slide: 0.06, merge: 0.06 };
// Merges climb a G major pentatonic scale with the tile value.
const SCALE = [
  392, 440, 494, 587, 659, 784, 880, 988, 1175, 1319, 1568, 1760, 1976
];

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  const lastPlayed = {};

  function unlock() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!ctx && Ctor) {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  }

  function tone(freq, duration, volume, delay = 0, type = "sine") {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + ATTACK);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const notes = (freqs, step, volume) =>
    freqs.forEach((f, i) => tone(f, step * 3, volume, i * step));

  const SOUNDS = {
    slide: () => tone(196, 0.09, 0.05),
    merge: (step = 0) => {
      const f = SCALE[Math.min(Math.max(step, 0), SCALE.length - 1)];
      tone(f, 0.45, 0.12);
      tone(f * 2, 0.3, 0.03, 0.02, "triangle");
    },
    undo: () => tone(330, 0.25, 0.07),
    win: () => notes([392, 494, 587, 784, 988], 0.12, 0.1),
    over: () => notes([587, 494, 440, 392], 0.18, 0.08)
  };

  function allowed(name) {
    const gap = MIN_GAP[name];
    if (!gap) return true;
    if (ctx.currentTime - (lastPlayed[name] ?? -1) < gap) return false;
    lastPlayed[name] = ctx.currentTime;
    return true;
  }

  return {
    unlock,
    play(name, arg) {
      if (!ctx || muted || ctx.state !== "running") return;
      if (allowed(name)) SOUNDS[name]?.(arg);
    },
    setMuted(value) {
      muted = value;
    },
    close() {
      ctx?.close().catch(() => {});
      ctx = null;
      master = null;
    }
  };
}
