// Synthesized sound effects (Web Audio API, no files). The context is
// created on the first user gesture (unlock) and closed by close().
// Rapid-fire sounds (bounces, wall growth) are rate-limited.
const MASTER_VOLUME = 0.35;
const MIN_GAP = { bounce: 0.045, grow: 0.04, tick: 0.2 };

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  let growStep = 0;
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

  function noise(duration, cutoff, volume = 0.4, delay = 0, type = "lowpass") {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime + delay;
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
    freqs.forEach((f, i) => tone(f, f, step * 1.4, type, i * step, volume));

  function shatter() {
    noise(0.45, 3500, 0.55, 0, "highpass");
    tone(320, 70, 0.3, "sawtooth", 0, 0.2);
    for (let i = 0; i < 7; i++) {
      const f = 2200 + Math.random() * 2800;
      tone(f, f * 0.8, 0.09, "sine", i * 0.035, 0.12);
    }
  }

  function grow() {
    growStep = (growStep + 1) % 8;
    tone(700 + growStep * 60, 700 + growStep * 60, 0.03, "square", 0, 0.05);
  }

  const SOUNDS = {
    bounce: () => tone(150, 80, 0.07, "sine", 0, 0.32),
    launch: () => tone(380, 760, 0.08, "square", 0, 0.14),
    grow,
    clack: () => {
      noise(0.05, 5000, 0.5);
      tone(1400, 320, 0.06, "square", 0, 0.16);
    },
    fill: () => {
      tone(220, 880, 0.32, "triangle", 0.03, 0.26);
      noise(0.3, 1400, 0.18, 0.03);
    },
    shatter,
    axis: () => tone(600, 900, 0.05, "triangle", 0, 0.22),
    deny: () => tone(170, 120, 0.1, "square", 0, 0.18),
    tick: () => tone(880, 880, 0.06, "square", 0, 0.16),
    timeout: () => notes([440, 330, 220], 0.12, "square", 0.2),
    win: () =>
      notes([523, 659, 784, 1047, 784, 1047, 1319], 0.1, "square", 0.2),
    lose: () => notes([392, 330, 262, 196], 0.2, "triangle", 0.4)
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
    play(name) {
      if (!ctx || muted || ctx.state !== "running") return;
      if (allowed(name)) SOUNDS[name]?.();
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
