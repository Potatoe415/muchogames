"use client";

import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Card, PlayerView } from "@/lib/bataillecorse";
import {
  anchorOf,
  canFlip,
  flipLimit,
  nextCards,
  projectQueue,
  reconcileFlipQueue,
  type FlipAnchor,
  type FlipProjection,
} from "./optimisticFlipQueue";

export { canFlip } from "./optimisticFlipQueue";

export interface UseOptimisticFlipResult {
  /** Server view says this seat may flip, and the pile-win sweep is not up. */
  myTurnToFlip: boolean;
  /** Another tap can paint immediately. Stays true through a tribute chain
   *  even while earlier taps are still waiting on the server. */
  canFlipMore: boolean;
  /** True from the first local tap until the server view has caught up. */
  pendingFlip: boolean;
  /** Kept for the pile: every queued card is a known face, so this stays false. */
  pendingFaceDown: boolean;
  optimisticStockCount: number;
  optimisticPile: PlayerView["pile"];
  optimisticTribute: PlayerView["tribute"];
  optimisticTurn: number;
  /** Tap the stock. No-ops when another flip would be illegal. */
  flip: () => void;
}

/**
 * La Bataille Corse's "feels instant" flip. A single flip paints `myTopCard`
 * on the same frame. Paying a tribute (several cards in a row) queues every
 * tap the same way — real faces, stock count, attempts — and submits the
 * flips one after another once the click has painted.
 */
export function useOptimisticFlip(
  view: PlayerView,
  mySeat: number,
  onFlip: () => Promise<void> | void,
  blocked = false,
): UseOptimisticFlipResult {
  const visible = useSyncedFlipQueue(view, mySeat);
  const projected = useProjectedQueue(view, mySeat, visible.cards);
  const flip = useQueuedFlip(view, mySeat, blocked, onFlip, visible);

  return {
    myTurnToFlip: canFlip(view, mySeat, blocked),
    canFlipMore: !blocked && visible.cards.length < flipLimit(view, mySeat),
    pendingFlip: visible.cards.length > 0,
    pendingFaceDown: false,
    optimisticStockCount: projected.stockCount,
    optimisticPile: projected.pile,
    optimisticTribute: projected.tribute,
    optimisticTurn: projected.turn,
    flip,
  };
}

function useProjectedQueue(view: PlayerView, mySeat: number, cards: Card[]): FlipProjection {
  return useMemo(() => projectQueue(view, mySeat, cards), [view, mySeat, cards]);
}

function useSyncedFlipQueue(view: PlayerView, mySeat: number): {
  cards: Card[];
  setQueue: (queue: Card[]) => void;
  setAnchor: (anchor: FlipAnchor) => void;
} {
  const [queue, setQueue] = useState<Card[]>([]);
  const [anchor, setAnchor] = useState<FlipAnchor>(() => anchorOf(view));
  const synced = reconcileFlipQueue(view, mySeat, queue, anchor);
  if (synced.changed) {
    setQueue(synced.queue);
    setAnchor(synced.anchor);
  }
  return { cards: synced.changed ? synced.queue : queue, setQueue, setAnchor };
}

function useQueuedFlip(
  view: PlayerView,
  mySeat: number,
  blocked: boolean,
  onFlip: () => Promise<void> | void,
  visible: { cards: Card[]; setQueue: (queue: Card[]) => void; setAnchor: (anchor: FlipAnchor) => void },
): () => void {
  const pendingRef = useRef<Card[]>([]);
  const drainingRef = useRef(false);

  return () => {
    const card = takeNextCard(view, mySeat, blocked, visible.cards);
    if (!card) return;
    const next = [...visible.cards, card];
    pendingRef.current = [...pendingRef.current, card];
    flushSync(() => {
      if (visible.cards.length === 0) visible.setAnchor(anchorOf(view));
      visible.setQueue(next);
    });
    startDrain(pendingRef, drainingRef, onFlip, () => flushSync(() => visible.setQueue([])));
  };
}

function takeNextCard(view: PlayerView, mySeat: number, blocked: boolean, queued: Card[]): Card | null {
  if (blocked || queued.length >= flipLimit(view, mySeat)) return null;
  return nextCards(view)[queued.length] ?? null;
}

function startDrain(
  pendingRef: { current: Card[] },
  drainingRef: { current: boolean },
  onFlip: () => Promise<void> | void,
  onReject: () => void,
): void {
  if (drainingRef.current || pendingRef.current.length === 0) return;
  drainingRef.current = true;
  setTimeout(() => {
    void runDrain(pendingRef, onFlip, onReject).finally(() => {
      drainingRef.current = false;
      if (pendingRef.current.length > 0) startDrain(pendingRef, drainingRef, onFlip, onReject);
    });
  }, 0);
}

async function runDrain(
  pendingRef: { current: Card[] },
  onFlip: () => Promise<void> | void,
  onReject: () => void,
): Promise<void> {
  while (pendingRef.current.length > 0) {
    pendingRef.current = pendingRef.current.slice(1);
    try {
      await onFlip();
    } catch {
      pendingRef.current = [];
      onReject();
      return;
    }
  }
}
