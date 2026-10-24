// Synthesized sound effects (Web Audio API, no files). The context is
// created on the first user gesture (unlock) and closed by close().
const MASTER_VOLUME = 0.35;

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
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

  function noise(duration, cutoff, volume = 0.4, delay = 0) {
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
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
  }

  const notes = (freqs, step, type, volume) =>
    freqs.forEach((f, i) => tone(f, f, step * 1.4, type, i * step, volume));

  const SOUNDS = {
    place: () => tone(520, 820, 0.07, "square", 0, 0.22),
    deny: () => tone(170, 120, 0.1, "square", 0, 0.18),
    destroy: () => {
      noise(0.32, 1800, 0.5);
      tone(240, 60, 0.28, "sawtooth", 0, 0.22);
    },
    tick: () => tone(880, 880, 0.06, "square", 0, 0.18),
    start: () => {
      tone(660, 660, 0.14, "square", 0, 0.28);
      tone(990, 990, 0.22, "square", 0.16, 0.28);
    },
    flow: () => tone(260, 130, 0.12, "sine", 0, 0.4),
    cross: () => notes([523, 659, 784, 1047, 1319], 0.06, "square", 0.22),
    leak: () => {
      tone(420, 80, 0.8, "sawtooth", 0, 0.25);
      noise(0.6, 900, 0.3);
    },
    pop: () => {
      noise(0.14, 2600, 0.4);
      tone(320, 90, 0.14, "square", 0, 0.16);
    },
    win: () => notes([523, 659, 784, 1047, 784, 1047], 0.11, "square", 0.22),
    lose: () => notes([392, 330, 262, 196], 0.2, "triangle", 0.4)
  };

  return {
    unlock,
    play(name) {
      if (!ctx || muted || ctx.state !== "running") return;
      SOUNDS[name]?.();
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
