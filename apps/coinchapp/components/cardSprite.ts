import type { CardOf, Suit } from "@/lib/cards";

const SUIT_SYMBOL: Record<Suit, string> = { H: "\u2665", D: "\u2666", C: "\u2663", S: "\u2660" };

export interface SpriteStyle {
  face: string;
  ink: string;
  red: string;
  font: string;
}

/** The app's colours and font, read once from the page's CSS variables. */
export function readSpriteStyle(): SpriteStyle {
  const root = getComputedStyle(document.documentElement);
  return {
    face: root.getPropertyValue("--card-face").trim() || "#fffaf1",
    ink: root.getPropertyValue("--card-ink").trim() || "#25233a",
    red: root.getPropertyValue("--accent-red").trim() || "#ee6e63",
    font: getComputedStyle(document.body).fontFamily,
  };
}

/** A canvas copy of `PlayingCard`'s look (corner index + big centre suit),
 *  for animations drawn on a `<canvas>` rather than in the DOM. */
export function renderCardSprite(card: CardOf<string>, width: number, height: number, dpr: number, style: SpriteStyle): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, width * 0.14);
  ctx.fillStyle = style.face;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = style.ink;
  ctx.stroke();

  const fontSize = width * 0.28;
  ctx.fillStyle = card.suit === "H" || card.suit === "D" ? style.red : style.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `900 ${fontSize}px ${style.font}`;
  ctx.fillText(card.rank, width * 0.08 + fontSize * 0.45, height * 0.06);
  ctx.font = `${fontSize * 0.9}px ${style.font}`;
  ctx.fillText(SUIT_SYMBOL[card.suit], width * 0.08 + fontSize * 0.45, height * 0.06 + fontSize);
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize * 2.2}px ${style.font}`;
  ctx.fillText(SUIT_SYMBOL[card.suit], width / 2, height * 0.55);
  return canvas;
}
