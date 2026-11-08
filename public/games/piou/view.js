// Canvas drawing: sky, parallax clouds, pipes, scrolling ground, the bird.
// The canvas fills its host; the world is HEIGHT units tall and as wide as
// the host's aspect ratio allows (`width` in engine units).
import { drawBird, drawCloud, drawPipe } from "./art.js";
import { BIRD_X, GROUND, HEIGHT } from "./engine.js";

const CLOUDS = [
  { x: 10, y: 16, size: 4 },
  { x: 55, y: 30, size: 3 },
  { x: 95, y: 12, size: 5 },
  { x: 140, y: 38, size: 3.5 },
  { x: 180, y: 22, size: 4.5 }
];
const CLOUD_LOOP = 220;

class View {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = HEIGHT;
    this.scale = 1;
    this.resize();
  }

  // Returns the world width, in engine units, for the host's current size.
  resize() {
    const host = this.canvas.parentElement;
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.scale = this.canvas.height / HEIGHT;
    this.width = (HEIGHT * w) / h;
    return this.width;
  }

  sky() {
    const { ctx } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, "#8fd3ff");
    sky.addColorStop(1, "#e3f6ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, GROUND);
  }

  clouds(dist) {
    CLOUDS.forEach((cloud) => {
      const loop = Math.max(CLOUD_LOOP, this.width + 20);
      const x = (((cloud.x - dist * 0.25) % loop) + loop) % loop;
      drawCloud(this.ctx, x - 10, cloud.y, cloud.size);
    });
  }

  ground(dist) {
    const { ctx } = this;
    ctx.fillStyle = "#7ccf6a";
    ctx.fillRect(0, GROUND, this.width, 2.4);
    ctx.fillStyle = "#e9cf8f";
    ctx.fillRect(0, GROUND + 2.4, this.width, HEIGHT - GROUND);
    ctx.fillStyle = "#d8b56d";
    const offset = dist % 8;
    for (let x = -offset; x < this.width; x += 8) {
      ctx.fillRect(x, GROUND + 4.5, 4, 1.4);
    }
  }

  render(state) {
    const { ctx } = this;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.sky();
    this.clouds(state.dist);
    state.pipes.forEach((pipe) => drawPipe(ctx, pipe));
    this.ground(state.dist);
    const tilt = Math.max(-0.45, Math.min(1.3, state.vy / 50));
    const bob = state.phase === "ready" ? Math.sin(performance.now() / 220) : 0;
    drawBird(ctx, BIRD_X, state.y + bob, tilt, state.vy < 0);
  }
}

export const createView = (canvas) => new View(canvas);
