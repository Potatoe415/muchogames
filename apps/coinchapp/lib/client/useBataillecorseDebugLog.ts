"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerView } from "@/lib/bataillecorse";
import { formatText, useI18n } from "@/lib/client/i18n";

export interface BataillecorseDebugLogEntry {
  id: number;
  text: string;
}

/** Caps the in-memory log so a very long match never grows this unbounded -
 *  same idea as `useBotRunner`'s `MAX_DEBUG_LOG`, just a larger cap since
 *  this log is meant to cover a whole match, not a rolling recent window. */
const MAX_LOG_ENTRIES = 300;

interface Snapshot {
  myStockCount: number;
  opponentStockCount: number;
  tributeSeat: number | null;
  lastPileWinId: number | null;
  lastFalseSlapId: number | null;
  winner: number | null;
}

function snapshotOf(view: PlayerView): Snapshot {
  return {
    myStockCount: view.myStockCount,
    opponentStockCount: view.opponentStockCount,
    tributeSeat: view.tribute?.seat ?? null,
    lastPileWinId: view.lastPileWin?.id ?? null,
    lastFalseSlapId: view.lastFalseSlap?.id ?? null,
    winner: view.winner,
  };
}

/** Diffs successive `PlayerView`s into a human-readable, one-line-per-move
 *  log for `BataillecorseDebugOverlay` - built purely from what each client
 *  already receives (no extra network calls), so it works identically for
 *  every mode this table can render into (solo/duel/online/ad-hoc, see
 *  `BataillecorseTable`/`BataillecorseDuelTable`). Seats are logged by their
 *  raw number (0/1), not "me"/"opponent": a debug tool should read the same
 *  regardless of which seat this client happens to be. */
export function useBataillecorseDebugLog(view: PlayerView | null): BataillecorseDebugLogEntry[] {
  const { t } = useI18n();
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

    if (view.myStockCount < prev.myStockCount) {
      lines.push(formatText(t("bataillecorseDebugFlip"), { seat: mySeat }));
    }
    if (view.opponentStockCount < prev.opponentStockCount) {
      lines.push(formatText(t("bataillecorseDebugFlip"), { seat: opponentSeat }));
    }

    const tributeSeat = view.tribute?.seat ?? null;
    if (view.tribute && tributeSeat !== prev.tributeSeat) {
      lines.push(
        formatText(t("bataillecorseDebugTribute"), {
          seat: view.tribute.seat,
          rank: view.tribute.fromRank,
          attempts: view.tribute.attemptsLeft,
        }),
      );
    }

    if (view.lastPileWin && view.lastPileWin.id !== prev.lastPileWinId) {
      const reasonText =
        view.lastPileWin.reason === "tribute"
          ? t("bataillecorseDebugReasonTribute")
          : view.lastPileWin.reason === "slap"
            ? t("bataillecorseDebugReasonSlap")
            : t("bataillecorseDebugReasonFalseSlap");
      lines.push(
        formatText(t("bataillecorseDebugPileWin"), {
          seat: view.lastPileWin.seat,
          count: view.lastPileWin.cardCount,
          reason: reasonText,
        }),
      );
    }

    if (view.lastFalseSlap && view.lastFalseSlap.id !== prev.lastFalseSlapId) {
      lines.push(formatText(t("bataillecorseDebugFalseSlap"), { seat: view.lastFalseSlap.seat }));
    }

    if (view.winner !== null && view.winner !== prev.winner) {
      lines.push(formatText(t("bataillecorseDebugGameOver"), { seat: view.winner }));
    }

    if (lines.length === 0) return;
    setLog((current) =>
      [...current, ...lines.map((text) => ({ id: nextIdRef.current++, text }))].slice(-MAX_LOG_ENTRIES),
    );
  }, [view, t]);

  return log;
}
