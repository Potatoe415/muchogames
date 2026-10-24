// Synthesized retro sounds (Web Audio API, no files). The context is created
// on the first user gesture (unlock) and closed by close(). A looping noise
// voice follows the skier's speed (snow glide); rapid-fire sounds are
// rate-limited.
const MASTER_VOLUME = 0.35;
const GLIDE_VOLUME = 0.07;
const MIN_GAP = { swish: 0.07, step: 0.06, trick: 0.05, chomp: 0.15 };

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let glide = null;
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
    freqs.forEach((f, i) => tone(f, f, step * 1.4, type, i * step, volume));

  function startGlide() {
    const source = noiseSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(master);
    source.start();
    glide = { source, gain, level: 0 };
  }

  const SOUNDS = {
    swish: () => noise(0.09, 3200, 0.14, 0, "bandpass"),
    step: () => noise(0.05, 2500, 0.22, 0, "highpass"),
    jump: () => tone(300, 720, 0.16, "square", 0, 0.12),
    land: () => noise(0.08, 900, 0.32),
    trick: () => tone(880, 1320, 0.06, "triangle", 0, 0.16),
    style: () => notes([660, 880, 1175], 0.07, "square", 0.14),
    crash: () => {
      noise(0.3, 1200, 0.6);
      tone(220, 60, 0.3, "sawtooth", 0, 0.24);
    },
    fire: () => {
      noise(0.9, 700, 0.5);
      for (let i = 0; i < 8; i++) noise(0.03, 4000, 0.3, i * 0.09, "highpass");
    },
    gate: () => tone(1320, 1320, 0.08, "square", 0, 0.14),
    gateMiss: () => tone(200, 140, 0.22, "square", 0, 0.18),
    start: () => notes([523, 784], 0.08, "square", 0.16),
    finish: () => notes([523, 659, 784, 1047], 0.1, "square", 0.18),
    woof: () => {
      tone(520, 260, 0.09, "sawtooth", 0, 0.22);
      tone(520, 260, 0.09, "sawtooth", 0.16, 0.22);
    },
    roar: () => {
      noise(1, 420, 0.55);
      tone(120, 70, 1, "sawtooth", 0, 0.32);
      tone(170, 90, 1, "square", 0.05, 0.14);
    },
    chomp: () => {
      noise(0.1, 700, 0.5);
      tone(150, 80, 0.1, "square", 0, 0.28);
    },
    turboOn: () => tone(400, 900, 0.12, "triangle", 0, 0.18),
    turboOff: () => tone(900, 400, 0.12, "triangle", 0, 0.18)
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
    setGlide(level) {
      if (!ctx) return;
      if (!glide) startGlide();
      const target = running() ? Math.min(1, level) * GLIDE_VOLUME : 0;
      if (Math.abs(target - glide.level) < 0.002) return;
      glide.level = target;
      glide.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
    },
    setMuted(value) {
      muted = value;
    },
    close() {
      glide?.source.stop();
      ctx?.close().catch(() => {});
      ctx = null;
      master = null;
      noiseBuffer = null;
      glide = null;
    }
  };
}
