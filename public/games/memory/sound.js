let ctx = null;
let muted = false;
const voices = new Set();

export const isMuted = () => muted;

export function setMuted(next) {
  muted = next;
  if (next) stop();
}

export function stop() {
  voices.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // Oscillator already ended.
    }
  });
  voices.clear();
}

export function unlock() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (!ctx) ctx = new Audio();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq, type, seconds, glideTo = null, delay = 0) {
  if (muted || !ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const peak = type === "sawtooth" ? 0.05 : 0.18;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + seconds);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  voices.add(osc);
  osc.onended = () => voices.delete(osc);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function playFlip() {
  tone(300, "sine", 0.05);
}

export function playMatch() {
  tone(523, "triangle", 0.15);
  tone(659, "triangle", 0.15, null, 0.12);
}

export function playMismatch() {
  tone(200, "sawtooth", 0.2, 150);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((freq, index) => {
    tone(freq, "triangle", 0.18, null, index * 0.14);
  });
}
