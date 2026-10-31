// Synthesized sound effects (Web Audio API, no files). The context is
// created on the first user gesture (unlock) and closed by close().
const MASTER_VOLUME = 0.4;
const MIN_GAP = { swoosh: 0.12, tick: 0.3 };
// C major pentatonic: consecutive cuts in one stroke climb this scale.
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

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

  function noise(duration, cutoff, volume, type = "bandpass") {
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
    filter.type = type;
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
    swoosh: () => noise(0.16, 2400, 0.22),
    cut: (step = 0) => {
      noise(0.12, 900, 0.35, "lowpass");
      const f = SCALE[Math.min(step, SCALE.length - 1)];
      tone(f, f * 1.02, 0.18, "triangle", 0, 0.28);
    },
    combo: () => notes([784, 988, 1175, 1568], 0.07, "square", 0.12),
    bonus: () => notes([1047, 1319, 1568, 2093, 2637], 0.06, "sine", 0.25),
    boom: () => {
      noise(0.7, 400, 0.8, "lowpass");
      tone(140, 40, 0.5, "sine", 0, 0.6);
    },
    go: () => notes([523, 659, 784, 1047], 0.09, "triangle", 0.3),
    tick: () => tone(1200, 1200, 0.05, "square", 0, 0.1),
    end: () =>
      notes([523, 659, 784, 1047, 784, 1047, 1319], 0.11, "triangle", 0.32)
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
