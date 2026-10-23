"use client";

import { useEffect, useRef } from "react";
import { SUITS } from "@/lib/cards";
import {
  FRAME_MS,
  ORIGINAL_CARD_WIDTH,
  isFlyerGone,
  launchFlyer,
  launchOrder,
  stepFlyer,
  type Flyer,
} from "@/lib/client/winCascade";
import type { Card, GameState } from "@/lib/solitaire";
import { readSpriteStyle, renderCardSprite } from "./cardSprite";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Scene {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  piles: Card[][];
  rects: Rect[];
  draw: (card: Card, x: number, y: number) => void;
}

/** Sizes the canvas to its box and finds the four foundations on screen
 *  (`SolitairePiles`' `solitaire-foundation-<suit>` elements). */
function buildScene(canvas: HTMLCanvasElement, foundations: GameState["foundations"]): Scene | null {
  const ctx = canvas.getContext("2d");
  const box = canvas.getBoundingClientRect();
  const rects = SUITS.map((suit) => document.querySelector(`[data-id="solitaire-foundation-${suit}"]`)?.getBoundingClientRect());
  if (!ctx || rects.some((rect) => !rect)) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  ctx.scale(dpr, dpr);
  const pileRects = rects.map((rect) => ({ x: rect!.left - box.left, y: rect!.top - box.top, w: rect!.width, h: rect!.height }));
  const { w, h } = pileRects[0];
  const style = readSpriteStyle();
  const sprites = new Map<string, HTMLCanvasElement>();
  const draw = (card: Card, x: number, y: number) => {
    const key = `${card.rank}${card.suit}`;
    if (!sprites.has(key)) sprites.set(key, renderCardSprite(card, w, h, dpr, style));
    ctx.drawImage(sprites.get(key)!, x, y, w, h);
  };
  return { ctx, width: box.width, height: box.height, piles: SUITS.map((suit) => foundations[suit]), rects: pileRects, draw };
}

/** Repaints a foundation with what is left on it once its top card has left. */
function drawPile(scene: Scene, pile: number, remaining: number) {
  const rect = scene.rects[pile];
  const top = scene.piles[pile][remaining - 1];
  if (top) scene.draw(top, rect.x, rect.y);
  else scene.ctx.clearRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
}

/** Plays the cascade one card at a time on a fixed 60 Hz step, never
 *  clearing the canvas so every card leaves its trail. Returns a stop function. */
function playCascade(scene: Scene, onDone: () => void): () => void {
  const order = launchOrder(scene.piles.map((pile) => pile.length));
  const { w, h } = scene.rects[0];
  const scale = w / ORIGINAL_CARD_WIDTH;
  let next = 0;
  let flying: { card: Card; flyer: Flyer } | null = null;
  let last = performance.now();
  let pending = 0;
  let frame = 0;

  const advance = (): boolean => {
    if (!flying) {
      if (next >= order.length) return false;
      const [pile, depth] = order[next++];
      const remaining = scene.piles[pile].length - depth - 1;
      const rect = scene.rects[pile];
      flying = { card: scene.piles[pile][remaining], flyer: launchFlyer(rect.x, rect.y, scale, Math.random) };
      drawPile(scene, pile, remaining);
    }
    flying.flyer = stepFlyer(flying.flyer, scene.height - h, scale);
    scene.draw(flying.card, flying.flyer.x, flying.flyer.y);
    if (isFlyerGone(flying.flyer, w, scene.width)) flying = null;
    return true;
  };

  const tick = (now: number) => {
    pending += Math.min(now - last, 100);
    last = now;
    for (; pending >= FRAME_MS; pending -= FRAME_MS) {
      if (!advance()) return onDone();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** The Windows Solitaire victory: every card bounces off the foundations,
 *  trailing copies of itself. Tap to skip. With reduced motion, the
 *  foundations are just shown as they are. */
export function SolitaireWinCascade({ foundations, onDone, skipHint }: { foundations: GameState["foundations"]; onDone: () => void; skipHint: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    let finished = false;
    let stop = () => {};
    const finish = () => {
      if (finished) return;
      finished = true;
      stop();
      onDone();
    };
    finishRef.current = finish;
    const scene = canvasRef.current && buildScene(canvasRef.current, foundations);
    if (!scene) return finish();
    scene.piles.forEach((pile, i) => drawPile(scene, i, pile.length));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    stop = playCascade(scene, finish);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once per won game.
  }, []);

  return (
    <div className="absolute inset-0 z-20" onClick={() => finishRef.current()} data-id="solitaire-win-cascade">
      <canvas ref={canvasRef} className="h-full w-full" />
      {skipHint && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center" data-id="solitaire-win-cascade-skip-hint">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">{skipHint}</span>
        </p>
      )}
    </div>
  );
}
