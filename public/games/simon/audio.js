// Synthesized tones (Web Audio API, no files). One tone per pad, taken from
// the original Simon (green 415 Hz, red 310, yellow 252, blue 209), plus a
// low buzz for a mistake. The context is created on the first gesture.
const MASTER_VOLUME = 0.4;
const ATTACK = 0.012;
const RELEASE = 0.06;
const PAD_FREQS = [415, 310, 252, 209];

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

  // Held at `volume` for `duration` seconds, then a short release.
  function tone(freq, duration, volume, type) {
    const t0 = ctx.currentTime;
    const end = t0 + Math.max(duration, ATTACK + RELEASE);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + ATTACK);
    gain.gain.setValueAtTime(volume, end - RELEASE);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(end + 0.02);
  }

  const ready = () => ctx && !muted && ctx.state === "running";

  return {
    unlock,
    pad(index, seconds) {
      if (!ready()) return;
      tone(PAD_FREQS[index], seconds, 0.22, "triangle");
      tone(PAD_FREQS[index] * 2, seconds, 0.03, "sine");
    },
    wrong() {
      if (!ready()) return;
      tone(98, 0.8, 0.14, "sawtooth");
      tone(73, 0.8, 0.12, "square");
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
