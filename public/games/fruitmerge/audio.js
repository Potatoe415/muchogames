// Synthesized sound effects (Web Audio API, no files), same pattern as
// Fruit Slash's. The context is created on the first gesture (unlock).
const MASTER_VOLUME = 0.4;
const MIN_GAP = { drop: 0.08, tick: 0.45 };
// Merges climb a major scale with the fruit level.
const SCALE = [392, 440, 494, 523, 587, 659, 740, 784, 880, 988, 1047];

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
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

  function tone(freq, endFreq, duration, type, delay = 0, volume = 0.3) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);
    }
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noise(duration, cutoff, volume) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(cutoff, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
  }

  const notes = (freqs, step, type, volume) =>
    freqs.forEach((f, i) => tone(f, f, step * 1.5, type, i * step, volume));

  const SOUNDS = {
    drop: () => tone(320, 180, 0.12, "sine", 0, 0.35),
    merge: (level = 0) => {
      const f = SCALE[Math.min(level, SCALE.length - 1)];
      tone(f, f * 1.5, 0.12, "triangle", 0, 0.3);
      tone(f * 2, f * 2, 0.08, "sine", 0.05, 0.12);
    },
    pair: () => notes([784, 988, 1175, 1568, 1976], 0.08, "triangle", 0.3),
    sweep: () => noise(0.35, 1800, 0.35),
    undo: () => tone(880, 440, 0.18, "sine", 0, 0.25),
    tick: () => tone(1100, 1100, 0.06, "square", 0, 0.08),
    over: () => notes([659, 587, 523, 440, 392], 0.14, "triangle", 0.3)
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
      noiseBuffer = null;
    }
  };
}
