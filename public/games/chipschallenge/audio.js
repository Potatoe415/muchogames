// Synthesized sounds (Web Audio API, no files). The context is created on
// the first user gesture (unlock) and closed by close(). Rapid-fire sounds
// are rate-limited.
const MASTER_VOLUME = 0.35;
const MIN_GAP = { step: 0.05, oof: 0.18, ice: 0.25, force: 0.25, tick: 0.5 };

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  const lastPlayed = {};

  function unlock() {
    const legacy = /** @type {any} */ (window).webkitAudioContext;
    const Ctor = window.AudioContext || legacy;
    if (!ctx && Ctor) {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  }

  function noiseSource() {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    return source;
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
    const t0 = ctx.currentTime + delay;
    const source = noiseSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = type;
    filter.frequency.setValueAtTime(cutoff, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
  }

  const notes = (freqs, step, type, volume) =>
    freqs.forEach((f, i) => tone(f, f, step * 1.3, type, i * step, volume));

  const SOUNDS = {
    step: () => noise(0.03, 3000, 0.12, 0, "highpass"),
    chip: () => tone(880, 1760, 0.09, "square", 0, 0.16),
    item: () => notes([660, 990, 1320], 0.05, "square", 0.14),
    door: () => {
      noise(0.12, 900, 0.3);
      tone(300, 520, 0.14, "triangle", 0, 0.2);
    },
    socket: () => notes([392, 523, 659, 784], 0.06, "triangle", 0.2),
    push: () => noise(0.1, 500, 0.35),
    ice: () => noise(0.35, 5000, 0.12, 0, "highpass"),
    force: () => tone(180, 240, 0.25, "sawtooth", 0, 0.08),
    splash: () => {
      noise(0.45, 1400, 0.5);
      tone(600, 120, 0.3, "sine", 0, 0.2);
    },
    fire: () => {
      noise(0.6, 900, 0.45);
      for (let i = 0; i < 7; i++) noise(0.03, 4500, 0.3, i * 0.08, "highpass");
    },
    bomb: () => {
      noise(0.9, 400, 0.8);
      tone(110, 35, 0.7, "sawtooth", 0, 0.35);
    },
    oof: () => tone(140, 90, 0.12, "square", 0, 0.22),
    thief: () => notes([784, 622, 494], 0.07, "square", 0.16),
    teleport: () => tone(300, 2400, 0.22, "sine", 0, 0.22),
    click: () => tone(1200, 1200, 0.03, "square", 0, 0.14),
    toggle: () => notes([440, 330], 0.05, "square", 0.16),
    tick: () => tone(1000, 1000, 0.025, "square", 0, 0.1),
    win: () => notes([523, 659, 784, 1047, 784, 1047], 0.11, "square", 0.18),
    bummer: () => {
      tone(220, 200, 0.22, "sawtooth", 0, 0.24);
      tone(165, 110, 0.4, "sawtooth", 0.24, 0.24);
    }
  };

  function allowed(name) {
    const gap = MIN_GAP[name];
    if (!gap) return true;
    if (ctx.currentTime - (lastPlayed[name] ?? -1) < gap) return false;
    lastPlayed[name] = ctx.currentTime;
    return true;
  }

  const running = () => ctx && !muted && ctx.state === "running";

  return {
    unlock,
    play(name) {
      if (running() && allowed(name)) SOUNDS[name]?.();
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
