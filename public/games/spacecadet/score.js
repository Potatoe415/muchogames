// Phone HUD: copy the scoreboard's score row into the top line.
const PHONE = "(max-width: 900px), (max-height: 520px)";
// ImGui menu bar height in canvas pixels; the table is stretched below it.
const MENU = 19;
const SCORE = { x: 0.72, y: 0.44, w: 0.245, h: 0.08 };

export function bindScoreLine() {
  const phone = window.matchMedia(PHONE);
  const canvas = document.getElementById("canvas");
  const score = document.querySelector("[data-id='spacecadet-score']");
  const ctx = score.getContext("2d");

  const paint = () => {
    if (phone.matches && canvas.height > MENU) blit(canvas, score, ctx);
    requestAnimationFrame(paint);
  };
  paint();
}

function blit(canvas, score, ctx) {
  const area = canvas.height - MENU;
  const sx = canvas.width * SCORE.x;
  const sy = MENU + area * SCORE.y;
  const sw = canvas.width * SCORE.w;
  const sh = area * SCORE.h;
  const dw = Math.max(1, Math.round(sw));
  const dh = Math.max(1, Math.round(sh));
  if (score.width !== dw) score.width = dw;
  if (score.height !== dh) score.height = dh;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, dw, dh);
}
