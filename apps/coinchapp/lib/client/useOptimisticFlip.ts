"use client";

import type { Card, PlayerView } from "@/lib/bataillecorse";
import { useInstantPending } from "./useInstantPending";

export interface PendingFlip {
  card: Card | null;
  pileLength: number;
  stockCount: number;
  lastPileWinId: number | null;
}

/** Whether this seat may flip right now. `blocked` covers UI-only holds the
 *  engine does not know about (the pile-win sweep: `useDisplayPile`'s
 *  `flying`), so spam-taps during that animation cannot queue real flips. */
export function canFlip(view: PlayerView, mySeat: number, blocked = false): boolean {
  return !blocked && view.phase === "playing" && view.turn === mySeat && view.slapWindow === null;
}

export interface UseOptimisticFlipResult {
  /** Whether it's currently this seat's turn to flip and no slap window is open. */
  myTurnToFlip: boolean;
  /** True from the instant the local player taps their stock until the
   *  server's view confirms the flip landed. */
  pendingFlip: boolean;
  /** True only when we have to land a card-back because `myTopCard` was
   *  missing — the normal path paints the real face from `optimisticPile`. */
  pendingFaceDown: boolean;
  /** `view.myStockCount`, minus one while `pendingFlip` is true. */
  optimisticStockCount: number;
  /** Center pile with this seat's just-tapped card already on top. */
  optimisticPile: PlayerView["pile"];
  /** Tap the stock: reflects the flip instantly in the UI, then awaits the
   *  real submit. Safe to call unconditionally — no-ops if it isn't this
   *  seat's turn, another flip is already in flight, or `blocked` (pile-win
   *  sweep still on screen). */
  flip: () => void;
}

/** True once the server view has moved on from the snapshot taken at tap —
 *  pile grew, stock changed, a pile-win fired, or the match ended. Must NOT
 *  key off `view.turn`: tribute keeps the same seat, and a stuck pending
 *  would freeze the next flip. */
export function flipHasLanded(view: PlayerView, pending: PendingFlip): boolean {
  return (
    view.phase !== "playing" ||
    view.pile.length !== pending.pileLength ||
    view.myStockCount !== pending.stockCount ||
    (view.lastPileWin?.id ?? null) !== pending.lastPileWinId
  );
}

function snapshotFlip(view: PlayerView): PendingFlip {
  return {
    card: view.myTopCard,
    pileLength: view.pile.length,
    stockCount: view.myStockCount,
    lastPileWinId: view.lastPileWin?.id ?? null,
  };
}

/**
 * La Bataille Corse's equivalent of `useOptimisticPlay`: the acting player's
 * own flip must feel local. `view.myTopCard` is that seat's next card (never
 * shown on the stock, never sent to the opponent), so the real face can land
 * on the center pile on the same frame as the tap.
 */
export function useOptimisticFlip(
  view: PlayerView,
  mySeat: number,
  onFlip: () => Promise<void> | void,
  blocked = false,
): UseOptimisticFlipResult {
  const myTurnToFlip = canFlip(view, mySeat, blocked);
  const { pending, run } = useInstantPending<PendingFlip>((p) => flipHasLanded(view, p));
  const live = pending !== null && !flipHasLanded(view, pending);

  function flip() {
    if (!myTurnToFlip) return;
    run(snapshotFlip(view), () => onFlip());
  }

  return {
    myTurnToFlip,
    pendingFlip: live,
    pendingFaceDown: Boolean(live && pending && pending.card === null),
    optimisticStockCount: live ? Math.max(0, view.myStockCount - 1) : view.myStockCount,
    optimisticPile: live && pending?.card ? [...view.pile, pending.card] : view.pile,
    flip,
  };
}
