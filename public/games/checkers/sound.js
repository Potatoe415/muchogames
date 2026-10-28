// Short synthesised sounds (Web Audio, no files). The context is created on
// the first sound, which always follows a tap.
let context = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = on;
}

function tone(freq, duration, { type = "sine", gain = 0.12, delay = 0 } = {}) {
  if (!enabled) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume();
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const volume = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    volume.gain.setValueAtTime(gain, start);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(volume).connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // No audio on this device: play silently.
  }
}

const arpeggio = (notes, step) =>
  notes.forEach((freq, i) =>
    tone(freq, 0.22, { type: "triangle", delay: i * step })
  );

export const sound = {
  move: () => tone(420, 0.08, { type: "triangle", gain: 0.16 }),
  capture: () => {
    tone(260, 0.1, { type: "square", gain: 0.06 });
    tone(180, 0.14, { type: "triangle", gain: 0.12, delay: 0.05 });
  },
  crown: () => arpeggio([660, 880, 1100], 0.08),
  win: () => arpeggio([523, 659, 784, 1046], 0.12),
  lose: () => arpeggio([392, 330, 262], 0.16),
  invalid: () => tone(140, 0.09, { type: "sine", gain: 0.08 })
};
