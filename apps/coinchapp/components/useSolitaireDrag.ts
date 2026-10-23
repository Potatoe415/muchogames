"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PileRef, Suit, Target } from "@/lib/solitaire";

/** Movement (px) before a press becomes a drag; below it, it stays a tap. */
const DRAG_THRESHOLD_PX = 8;
/** The click a browser fires right after a drag must not count as a tap. */
const CLICK_AFTER_DRAG_MS = 400;

export interface DragState {
  from: PileRef;
  dx: number;
  dy: number;
}

function pileKey(pile: PileRef | Target): string {
  if (pile.kind === "foundation") return `foundation-${pile.suit}`;
  if (pile.kind === "tableau") return `tableau-${pile.col}`;
  return "waste";
}

/** Value for a drop zone's `data-drop` attribute. */
export function dropKey(target: Target): string {
  return pileKey(target);
}

function parseDropKey(key: string): Target | null {
  const [kind, value] = key.split("-");
  if (kind === "foundation") return { kind: "foundation", suit: value as Suit };
  if (kind === "tableau") return { kind: "tableau", col: Number(value) };
  return null;
}

/** The drop zone under the pointer, skipping the dragged cards' own pile
 *  (they sit under the pointer too). */
function dropTargetAt(x: number, y: number, from: PileRef): Target | null {
  const sourceKey = pileKey(from);
  for (const element of document.elementsFromPoint(x, y)) {
    const key = element.closest("[data-drop]")?.getAttribute("data-drop");
    if (key && key !== sourceKey) return parseDropKey(key);
  }
  return null;
}

/** Drag and drop on top of tap-to-move: a press that moves further than a
 *  few pixels drags the pressed cards, which follow the pointer and land on
 *  the drop zone they are released over. Listens on `window` so a fast
 *  pointer never escapes the card. */
export function useSolitaireDrag(onDrop: (from: PileRef, to: Target) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const onDropRef = useRef(onDrop);
  const stopRef = useRef<() => void>(() => {});
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);
  useEffect(() => () => stopRef.current(), []);

  const startDrag = useCallback((from: PileRef, event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    stopRef.current();
    const origin = { x: event.clientX, y: event.clientY };
    let active = false;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (!active && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      active = true;
      setDrag({ from, dx, dy });
    };
    const end = (e: PointerEvent) => {
      stopRef.current();
      if (!active) return;
      setDrag(null);
      suppressClickUntil.current = performance.now() + CLICK_AFTER_DRAG_MS;
      const target = e.type === "pointerup" ? dropTargetAt(e.clientX, e.clientY, from) : null;
      if (target) onDropRef.current(from, target);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    stopRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      stopRef.current = () => {};
    };
  }, []);

  /** True for the click that ends a drag: the caller ignores it. */
  const isClickAfterDrag = useCallback(() => performance.now() < suppressClickUntil.current, []);

  return { drag, startDrag, isClickAfterDrag };
}
