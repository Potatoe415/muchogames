// Synthesized sounds (Web Audio API, no files): a chirp for each flap, a
// two-note ding for a point, a thud on a hit. The context is created on the
// first gesture (the Play / Resume click).
const MASTER_VOLUME = 0.35;

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

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

  // A tone gliding from `from` to `to` Hz, starting `delay` s from now.
  function glide(from, to, duration, volume, type, delay = 0) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const SOUNDS = {
    flap: () => glide(520, 900, 0.09, 0.18, "triangle"),
    point: () => {
      glide(880, 880, 0.08, 0.16, "square");
      glide(1320, 1320, 0.14, 0.14, "square", 0.08);
    },
    hit: () => {
      glide(180, 60, 0.3, 0.3, "sawtooth");
      glide(90, 40, 0.35, 0.25, "sine");
    }
  };

  return {
    unlock,
    play(name) {
      if (!ctx || muted || ctx.state !== "running") return;
      SOUNDS[name]?.();
    },
    setMuted(value) {
      muted = value;
    }
  };
}
