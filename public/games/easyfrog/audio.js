// Sound effects and loops (Web Audio). Missing audio support or a file that
// fails to load never breaks the game: it just stays silent.
const SOUNDS = [
  "jump",
  "level6",
  "road",
  "water",
  "win-slot",
  "car-collision",
  "end-death",
  "fly-eat",
  "water-collision",
  "train",
  "win-end",
  "heartbeat",
  "timeout"
];

function createContext() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    return Context ? new Context() : null;
  } catch {
    return null;
  }
}

class SoundManager {
  constructor() {
    this.ctx = createContext();
    this.buffers = {};
    this.loops = {};
    this.muted = false;
  }

  async load(key) {
    if (!this.ctx) return;
    try {
      const response = await fetch(`sounds/${key}.mp3`);
      if (!response.ok) return;
      const data = await response.arrayBuffer();
      this.buffers[key] = await this.ctx.decodeAudioData(data);
    } catch {
      // Unsupported format or network error: this sound stays silent.
    }
  }

  loadAll() {
    return Promise.all(SOUNDS.map((key) => this.load(key)));
  }

  // Browsers start audio suspended until a user gesture: call from a click.
  unlock() {
    if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.stopAllLoops();
  }

  canPlay(key) {
    return Boolean(this.ctx && !this.muted && this.buffers[key]);
  }

  source(key, loop) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];
    source.loop = loop;
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(this.ctx.destination);
    return { source, gain };
  }

  play(key, volume = 1) {
    if (!this.canPlay(key)) return;
    const { source, gain } = this.source(key, false);
    gain.gain.value = volume;
    source.start(0);
  }

  // A loop starting at `from` volume and reaching `to` after `seconds`.
  playLoop(key, from, to = from, seconds = 0) {
    if (!this.canPlay(key) || this.loops[key]) return;
    const { source, gain } = this.source(key, true);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(from, now);
    if (seconds > 0) gain.gain.linearRampToValueAtTime(to, now + seconds);
    source.start(0);
    this.loops[key] = source;
  }

  stopLoop(key) {
    try {
      this.loops[key]?.stop();
    } catch {
      // Already stopped.
    }
    delete this.loops[key];
  }

  stopAllLoops() {
    Object.keys(this.loops).forEach((key) => this.stopLoop(key));
  }
}

export const createAudio = () => new SoundManager();
