"use client";

import type { PlayerView } from "@/lib/bataillecorse";
import { formatText, useI18n } from "@/lib/client/i18n";
import type { EnterDirection } from "./TrickStage";
import { FalseSlapMark, PileStack, TributePlayHint } from "./BataillecorseTable";

/** The shared center pile plus both seats' slap hit-zones, stacked in one
 *  spot: unlike each player's own corner (`DuelPlayerCorner`), this is never
 *  rotated - a real card on the table, glanced at from either side, exactly
 *  like the shared corner deck any physical slap/war card game already has.
 *  The tap target is split top/bottom (not one shared button) purely so the
 *  game can tell which seat actually reached for it - see docs/DECISIONS.md. */
export function DuelCenterBlock({
  pile,
  enterFrom,
  pendingFaceDown,
  fly,
  slapImpact,
  tapHitKey,
  onSlapTop,
  onSlapBottom,
  slapDisabled,
  slapLabel,
  slapWindowUrgent,
  falseSlapFlash,
  falseSlapLabel,
  tribute,
  pileWinFlash,
  lastPileWin,
  pileWinnerLabel,
  justEnteredCardKey,
}: {
  pile: PlayerView["pile"];
  enterFrom: EnterDirection;
  pendingFaceDown?: boolean;
  fly?: { key: number; toward: "up" | "down" };
  slapImpact?: boolean;
  tapHitKey: number;
  onSlapTop: () => void;
  onSlapBottom: () => void;
  slapDisabled: boolean;
  slapLabel: string;
  slapWindowUrgent: boolean;
  falseSlapFlash: boolean;
  falseSlapLabel: string;
  tribute: PlayerView["tribute"];
  pileWinFlash: boolean;
  lastPileWin: PlayerView["lastPileWin"];
  pileWinnerLabel: string | null;
  justEnteredCardKey: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3" data-id="bataillecorse-duel-center-block">
      <div
        className={[
          "relative flex h-[var(--slap-circle-size)] w-[var(--slap-circle-size)] items-center justify-center rounded-full transition-all",
          slapWindowUrgent
            ? "animate-pulse bg-[var(--accent-red)]/15 ring-4 ring-[var(--accent-red)]"
            : "bg-white/5 ring-1 ring-white/20",
        ].join(" ")}
        data-id="bataillecorse-duel-slap-visual"
      >
        <button
          type="button"
          data-id="bataillecorse-duel-slap-top"
          onClick={onSlapTop}
          disabled={slapDisabled}
          aria-label={slapLabel}
          className="absolute inset-x-0 top-0 h-1/2 rounded-t-full active:scale-95"
        />
        <button
          type="button"
          data-id="bataillecorse-duel-slap-bottom"
          onClick={onSlapBottom}
          disabled={slapDisabled}
          aria-label={slapLabel}
          className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full active:scale-95"
        />
        <div className="pointer-events-none">
          <PileStack
            cards={pile}
            enterFrom={enterFrom}
            fly={fly}
            slapImpact={slapImpact}
            tapHitKey={tapHitKey}
            pendingFaceDown={pendingFaceDown}
            justEnteredCardKey={justEnteredCardKey}
          />
        </div>
        {falseSlapFlash && <FalseSlapMark label={falseSlapLabel} />}
      </div>

      <div className="flex min-h-[1.75rem] flex-col items-center gap-1.5">
        {tribute && tribute.seat === 0 && (
          <TributePlayHint attempts={tribute.attemptsLeft} dataId="bataillecorse-duel-tribute-banner" />
        )}
        {pileWinFlash && lastPileWin && lastPileWin.reason !== "falseSlap" && pileWinnerLabel && (
          <p
            className="rounded-full bg-[var(--accent-yellow)] px-4 py-1.5 text-center text-xs font-black text-[var(--surface)]"
            data-id="bataillecorse-duel-pile-win-flash"
          >
            {formatText(t("pileWonBanner"), { player: pileWinnerLabel, count: lastPileWin.cardCount })}
          </p>
        )}
      </div>
    </div>
  );
}
