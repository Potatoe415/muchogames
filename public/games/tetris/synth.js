// Synthesized sounds (Web Audio API, no files). Short, soft, never harsh.
const MASTER_VOLUME = 0.3;
const ATTACK = 0.01;

function makeTone(ctx, master) {
  return (freq, duration, volume, delay = 0, type = "sine") => {
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
  };
}

function makeSounds(tone) {
  const notes = (freqs, step, volume) =>
    freqs.forEach((f, i) => tone(f, step * 2.5, volume, i * step));
  return {
    move: () => tone(300, 0.04, 0.05),
    rotate: () => tone(440, 0.05, 0.06, 0, "triangle"),
    hard: () => tone(110, 0.12, 0.14, 0, "triangle"),
    lock: () => tone(220, 0.07, 0.07),
    clear: (n = 1) => notes([523, 659, 784, 1047].slice(0, n + 1), 0.07, 0.1),
    level: () => notes([523, 659, 784, 1047, 1319], 0.08, 0.1),
    over: () => notes([392, 330, 262, 196], 0.16, 0.1)
  };
}

// Returns { ctx, sounds }, or null when the browser has no Web Audio.
export function openAudio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(ctx.destination);
  return { ctx, sounds: makeSounds(makeTone(ctx, master)) };
}
