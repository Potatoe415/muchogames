// Soft synthesised sounds (Web Audio, no files): a wooden tap for tiles, a
// gentle chime for a word. The context is created on the first sound, which
// always follows a tap.
let context = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = on;
}

function tone(freq, duration, { type = "sine", gain = 0.08, delay = 0 } = {}) {
  if (!enabled) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume();
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const volume = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(volume).connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // No audio on this device: play silently.
  }
}

const chime = (notes, step, gain = 0.06) =>
  notes.forEach((freq, i) => tone(freq, 0.6, { gain, delay: i * step }));

export const sound = {
  tap: () => tone(620, 0.05, { type: "triangle", gain: 0.05 }),
  place: () => tone(330, 0.07, { type: "triangle", gain: 0.09 }),
  play: () => chime([523, 659, 784], 0.07),
  bingo: () => chime([523, 659, 784, 1046, 1318], 0.09, 0.07),
  win: () => chime([392, 523, 659, 784], 0.14),
  end: () => chime([440, 392, 330], 0.18, 0.05),
  invalid: () => tone(180, 0.12, { gain: 0.05 })
};
