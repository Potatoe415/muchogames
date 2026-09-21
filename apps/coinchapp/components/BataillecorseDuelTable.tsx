"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlayerView, Seat } from "@/lib/bataillecorse";
import { formatText, useI18n } from "@/lib/client/i18n";
import { useOptimisticFlip } from "@/lib/client/useOptimisticFlip";
import type { BataillecorseDuelActions } from "@/lib/client/useLocalBataillecorseDuelGame";
import { GameInfoButton } from "./GameHud";
import type { EnterDirection } from "./TrickStage";
import { TableShell } from "./TableShell";
import {
  InfoPanel,
  ReactionTimesReadout,
  StockPile,
  useDisplayPile,
  useFlash,
  usePileEnterDirection,
  useSeatReactionMs,
  useSlapWindowUrgent,
  useWindowSeenAtRef,
  useWinnerFireSeat,
} from "./BataillecorseTable";
import { DuelCenterBlock } from "./BataillecorseDuelCenter";

/** Face-to-face 1v1 la Bataille Corse: both real players share one device,
 *  sitting on opposite sides of it (see docs/DECISIONS.md). Reuses the
 *  vs-bot table's shared pieces (`StockPile`, pile hooks, `InfoPanel`) but
 *  renders BOTH seats' own name/stock/reaction-time - seat 1's corner is
 *  rotated 180deg so it reads upright from their side, while the shared pile
 *  stays neutral in the middle (like a real card on the table, glanced at
 *  from either side). Never records match stats (see `DuelFinishedOverlay`):
 *  there is no single "you" here to attribute a win/loss to. */
export function BataillecorseDuelTable({
  viewA,
  viewB,
  actions,
  onReset,
}: {
  viewA: PlayerView;
  viewB: PlayerView;
  actions: BataillecorseDuelActions;
  onReset: () => void;
}) {
  const { locale, t } = useI18n();
  const [panelOpen, setPanelOpen] = useState(false);
  const flipA = useOptimisticFlip(viewA, 0, () => actions.onFlip(0));
  const flipB = useOptimisticFlip(viewB, 1, () => actions.onFlip(1));
  const windowSeenAtRef = useWindowSeenAtRef(viewA.slapWindow);

  const pileWinFlash = useFlash(viewA.lastPileWin?.id);
  const falseSlapFlash = useFlash(viewA.lastFalseSlap?.id);
  const pileEnterDirection = usePileEnterDirection(viewA);
  const { pile: displayPile, flying: pileFlying, justEnteredCardKey } = useDisplayPile(viewA.pile, viewA.lastPileWin);
  const optimisticPile = flipA.pendingFlip ? flipA.optimisticPile : flipB.pendingFlip ? flipB.optimisticPile : viewA.pile;
  const shownPile = pileFlying ? displayPile : optimisticPile;
  const enterFrom: EnterDirection = flipA.pendingFlip ? "bottom" : flipB.pendingFlip ? "top" : pileEnterDirection;
  const pileFlyTarget: "up" | "down" | null =
    pileFlying && viewA.lastPileWin ? (viewA.lastPileWin.seat === 0 ? "down" : "up") : null;
  const slapWindowUrgent = useSlapWindowUrgent(viewA.slapWindow);
  const reactionA = useSeatReactionMs(viewA.lastPileWin, 0);
  const reactionB = useSeatReactionMs(viewA.lastPileWin, 1);
  const winnerFireSeat = useWinnerFireSeat(viewA.lastPileWin);
  const [slapTapKey, setSlapTapKey] = useState(0);
  const slapImpact =
    pileFlyTarget !== null && (viewA.lastPileWin?.reason === "slap" || viewA.lastPileWin?.reason === "falseSlap");

  async function tapSlap(seat: Seat) {
    if (viewA.phase !== "playing") return;
    setSlapTapKey((n) => n + 1);
    const seen = viewA.slapWindow && windowSeenAtRef.current?.id === viewA.slapWindow.id ? windowSeenAtRef.current : null;
    const reactionMs = seen ? performance.now() - seen.perfMs : 0;
    // Only the window THIS client currently sees open counts as "observed" -
    // never fall back to `lastClosedSlapWindowId` (see `BataillecorseTable.tsx`'s
    // `tapSlap` for why: it would silently exempt every later bogus tap from
    // the false-slap penalty).
    const observedWindowId = viewA.slapWindow?.id ?? null;
    await actions.onSlap(seat, reactionMs, observedWindowId);
  }

  const player1 = formatText(t("defaultPlayerName"), { seat: 1 });
  const player2 = formatText(t("defaultPlayerName"), { seat: 2 });
  const owedByLabel = viewA.tribute ? (viewA.tribute.seat === 0 ? player1 : player2) : null;
  const pileWinnerLabel = viewA.lastPileWin ? (viewA.lastPileWin.seat === 0 ? player1 : player2) : null;

  return (
    <TableShell dataId="bataillecorse-duel-table">
      <header className="absolute inset-x-0 top-[var(--table-hud-top)] z-30 flex items-center justify-between px-3">
        <Link
          href="/"
          aria-label={t("back")}
          data-id="bataillecorse-duel-back"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card-face)] text-5xl font-black leading-none text-[var(--surface)] shadow-lg"
        >
          ‹
        </Link>
        <GameInfoButton label={t("gameInfo")} onClick={() => setPanelOpen(true)} />
      </header>

      {panelOpen && <InfoPanel onReset={onReset} onClose={() => setPanelOpen(false)} />}

      <div className="relative h-0 min-h-0 flex-1" data-id="bataillecorse-duel-scene">
        <DuelPlayerCorner
          label={player2}
          stockCount={flipB.optimisticStockCount}
          onFlip={flipB.flip}
          disabled={!flipB.myTurnToFlip || flipB.pendingFlip}
          fire={winnerFireSeat === 1}
          mineMs={reactionB}
          opponentMs={reactionA}
          locale={locale}
          rotated
          dataId="bataillecorse-duel-player2"
          className="top-6"
        />

        <DuelCenterBlock
          pile={shownPile}
          enterFrom={enterFrom}
          pendingFaceDown={flipA.pendingFaceDown || flipB.pendingFaceDown}
          fly={pileFlyTarget ? { key: viewA.lastPileWin!.id, toward: pileFlyTarget } : undefined}
          slapImpact={slapImpact}
          tapHitKey={slapTapKey}
          justEnteredCardKey={justEnteredCardKey}
          onSlapTop={() => tapSlap(1)}
          onSlapBottom={() => tapSlap(0)}
          slapDisabled={viewA.phase !== "playing"}
          slapLabel={t("slapPileButton")}
          slapWindowUrgent={slapWindowUrgent}
          falseSlapFlash={falseSlapFlash && Boolean(viewA.lastFalseSlap)}
          falseSlapLabel={t("falseSlapStamp")}
          tribute={viewA.tribute}
          owedByLabel={owedByLabel}
          pileWinFlash={pileWinFlash}
          lastPileWin={viewA.lastPileWin}
          pileWinnerLabel={pileWinnerLabel}
        />

        <DuelPlayerCorner
          label={player1}
          stockCount={flipA.optimisticStockCount}
          onFlip={flipA.flip}
          disabled={!flipA.myTurnToFlip || flipA.pendingFlip}
          fire={winnerFireSeat === 0}
          mineMs={reactionA}
          opponentMs={reactionB}
          locale={locale}
          dataId="bataillecorse-duel-player1"
          className="bottom-10"
        />
      </div>

      {viewA.phase === "finished" && (
        <DuelFinishedOverlay winner={viewA.winner} player1={player1} player2={player2} onReset={onReset} />
      )}
    </TableShell>
  );
}

/** One player's own zone: name, own reaction-time readout (their own time
 *  first), and their own tappable stock. `rotated` flips the whole block
 *  180deg so the player sitting on that side of the phone reads it upright. */
function DuelPlayerCorner({
  label,
  stockCount,
  onFlip,
  disabled,
  fire,
  mineMs,
  opponentMs,
  locale,
  rotated,
  dataId,
  className,
}: {
  label: string;
  stockCount: number;
  onFlip: () => void;
  disabled: boolean;
  fire: boolean;
  mineMs: number | null;
  opponentMs: number | null;
  locale: "fr" | "en";
  rotated?: boolean;
  dataId: string;
  className: string;
}) {
  return (
    <div
      className={`absolute inset-x-0 flex flex-col items-center gap-1.5 ${className}`}
      style={rotated ? { transform: "rotate(180deg)" } : undefined}
      data-id={dataId}
    >
      <p className="text-xs font-bold uppercase" data-id={`${dataId}-name`}>{label}</p>
      <ReactionTimesReadout mineMs={mineMs} opponentMs={opponentMs} locale={locale} />
      <StockPile count={stockCount} dataId={`${dataId}-stock`} scale={1.5} onClick={onFlip} disabled={disabled} fire={fire} />
    </div>
  );
}

function DuelFinishedOverlay({
  winner,
  player1,
  player2,
  onReset,
}: {
  winner: Seat | null;
  player1: string;
  player2: string;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const winnerLabel = winner === 0 ? player1 : player2;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6" data-id="bataillecorse-duel-finished-overlay">
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl">
        <p className="mb-1 text-sm font-bold uppercase text-[var(--card-face)]/60">{t("gameFinished")}</p>
        <p className="mb-4 text-2xl font-black text-[var(--card-face)]" data-id="bataillecorse-duel-winner-name">
          {formatText(t("bataillecorseWinnerBanner"), { player: winnerLabel })}
        </p>
        <button
          data-id="bataillecorse-duel-play-again-button"
          onClick={onReset}
          className="w-full rounded-lg bg-[var(--accent-yellow)] py-2 font-bold text-[var(--surface)]"
        >
          {t("newGame")}
        </button>
      </div>
    </div>
  );
}
