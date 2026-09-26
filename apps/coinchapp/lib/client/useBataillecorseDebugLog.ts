"use client";

import { useEffect, useRef, useState } from "react";
import type { Card, PlayerView, Suit } from "@/lib/bataillecorse";

export interface BataillecorseDebugLogEntry {
  id: number;
  text: string;
}

/** Caps the in-memory log so a very long match never grows this unbounded -
 *  same idea as `useBotRunner`'s `MAX_DEBUG_LOG`, just a larger cap since
 *  this log is meant to cover a whole match, not a rolling recent window. */
const MAX_LOG_ENTRIES = 300;

/** Deliberately English-only, always - this is a developer diagnostic tool,
 *  never shown to a player as gameplay copy, so it does not follow the
 *  app's `useI18n` locale (see docs/DECISIONS.md's "debug in English"). */
const SUIT_SYMBOL: Record<Suit, string> = { H: "\u2665", D: "\u2666", C: "\u2663", S: "\u2660" };

function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

interface Snapshot {
  myStockCount: number;
  opponentStockCount: number;
  pileLength: number;
  tributeSeat: number | null;
  lastPileWinId: number | null;
  lastFalseSlapId: number | null;
  winner: number | null;
}

function snapshotOf(view: PlayerView): Snapshot {
  return {
    myStockCount: view.myStockCount,
    opponentStockCount: view.opponentStockCount,
    pileLength: view.pile.length,
    tributeSeat: view.tribute?.seat ?? null,
    lastPileWinId: view.lastPileWin?.id ?? null,
    lastFalseSlapId: view.lastFalseSlap?.id ?? null,
    winner: view.winner,
  };
}

/** Diffs successive `PlayerView`s into a human-readable, one-line-per-move
 *  log for `BataillecorseDebugOverlay`, appended in the order these events
 *  actually happen (oldest first) - built purely from what each client
 *  already receives (no extra network calls), so it works identically for
 *  every mode this table can render into (solo/duel/online/ad-hoc, see
 *  `BataillecorseTable`/`BataillecorseDuelTable`). Seats are logged by their
 *  raw number (0/1), not "me"/"opponent": a debug tool should read the same
 *  regardless of which seat this client happens to be.
 *
 *  A figure/ace flip and the fresh tribute it opens for the other seat are
 *  really one engine event (see `resolveTributeEffect` in `tribute.ts` -
 *  both are set atomically by the same `submitFlip` call), so they're folded
 *  into a single log line instead of two. A pile win (any reason) stays its
 *  own line, since it can follow a flip several plies later (a tribute
 *  finally failing) or come from an unrelated slap. */
export function useBataillecorseDebugLog(view: PlayerView | null): BataillecorseDebugLogEntry[] {
  const [log, setLog] = useState<BataillecorseDebugLogEntry[]>([]);
  const nextIdRef = useRef(0);
  const prevRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    if (!view) return;
    const prev = prevRef.current;
    prevRef.current = snapshotOf(view);
    if (!prev) return;

    const mySeat = view.mySeat;
    const opponentSeat = mySeat === 0 ? 1 : 0;
    const lines: string[] = [];

    const flippedSeat =
      view.myStockCount < prev.myStockCount ? mySeat : view.opponentStockCount < prev.opponentStockCount ? opponentSeat : null;

    if (flippedSeat !== null) {
      // The card just flipped: normally the pile's new top card, but a
      // failed tribute answer both plays AND sweeps that same card away in
      // one atomic engine update (see `engine.ts`'s `applyFalseSlapPenalty`/
      // `awardPile`), so `view.pile` never observably grows for it - only
      // `lastPileWin.cards` (a fresh "tribute"-reason win) ever carries it.
      const cardAdded = view.pile.length > prev.pileLength ? view.pile[view.pile.length - 1] : null;
      const sweptFlipCard =
        !cardAdded && view.lastPileWin && view.lastPileWin.id !== prev.lastPileWinId && view.lastPileWin.reason === "tribute"
          ? view.lastPileWin.cards[view.lastPileWin.cards.length - 1]
          : null;
      const flippedCard = cardAdded ?? sweptFlipCard;
      const flippedCardLabel = flippedCard ? formatCard(flippedCard) : "?";

      const otherSeat = flippedSeat === 0 ? 1 : 0;
      const newTributeAttempts =
        view.tribute && view.tribute.seat === otherSeat && view.tribute.seat !== prev.tributeSeat
          ? view.tribute.attemptsLeft
          : null;

      lines.push(
        newTributeAttempts !== null
          ? `P${flippedSeat} flips ${flippedCardLabel} - P${otherSeat} owes ${newTributeAttempts}`
          : `P${flippedSeat} flips ${flippedCardLabel}`,
      );
    }

    if (view.lastPileWin && view.lastPileWin.id !== prev.lastPileWinId) {
      // Names the actual reason and lists every swept card (not just the
      // top ~3 `PileStack` renders on screen - see `PILE_HISTORY_DEPTH` in
      // `BataillecorseTable.tsx`), so a slap/sandwich pattern buried under
      // tribute fillers is verifiable here even when it never became
      // visible on the table itself.
      const win = view.lastPileWin;
      const reasonText = win.reason === "tribute" ? "failed tribute" : win.reason === "slap" ? "slap" : "false slap";
      const cardsText = win.cards.map(formatCard).join(" ");
      lines.push(`P${win.seat} wins ${win.cardCount} cards (${reasonText}): ${cardsText}`);
    }

    if (view.lastFalseSlap && view.lastFalseSlap.id !== prev.lastFalseSlapId) {
      lines.push(`P${view.lastFalseSlap.seat} false-slaps`);
    }

    if (view.winner !== null && view.winner !== prev.winner) {
      lines.push(`P${view.winner} wins the match`);
    }

    if (lines.length === 0) return;
    setLog((current) =>
      [...current, ...lines.map((text) => ({ id: nextIdRef.current++, text }))].slice(-MAX_LOG_ENTRIES),
    );
  }, [view]);

  return log;
}
