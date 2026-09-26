"use client";

import type { PlayerView } from "@/lib/bataillecorse";
import { useI18n } from "@/lib/client/i18n";
import { useBataillecorseDebugLog } from "@/lib/client/useBataillecorseDebugLog";

export type BataillecorseDebugMode = "solo" | "duel" | "online" | "adhoc";

/** Left-side, semi-transparent, read-only debug HUD for la Bataille Corse -
 *  on when the splash screen's debug checkbox is checked (see
 *  `app/bataillecorse/page.tsx`, `useBataillecorseDebugMode`). Shows which
 *  game/match type is running, then every move as it happens (see
 *  `useBataillecorseDebugLog`). `pointer-events-none`: purely informational,
 *  it must never block a tap on the table underneath. */
export function BataillecorseDebugOverlay({ mode, view }: { mode: BataillecorseDebugMode; view: PlayerView | null }) {
  const { t } = useI18n();
  const log = useBataillecorseDebugLog(view);
  const modeLabel =
    mode === "solo"
      ? t("bataillecorseDebugModeSolo")
      : mode === "duel"
        ? t("bataillecorseDebugModeDuel")
        : mode === "online"
          ? t("bataillecorseDebugModeOnline")
          : t("bataillecorseDebugModeAdhoc");

  return (
    <div
      data-id="bataillecorse-debug-overlay"
      className="pointer-events-none fixed left-2 top-2 z-50 max-h-[85vh] w-[min(58vw,220px)] overflow-y-auto rounded-xl bg-black/60 p-2 text-[10px] leading-tight text-white/90 shadow-xl ring-1 ring-white/15 backdrop-blur"
    >
      <p className="mb-1 font-bold uppercase tracking-wide text-white/60">{t("bataillecorseDebugPanelTitle")}</p>
      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5" data-id="bataillecorse-debug-info">
        <dt className="text-white/50">{t("bataillecorseDebugGameLabel")}</dt>
        <dd data-id="bataillecorse-debug-game-value">{t("bataillecorseDebugGameValue")}</dd>
        <dt className="text-white/50">{t("bataillecorseDebugModeLabel")}</dt>
        <dd data-id="bataillecorse-debug-mode-value">{modeLabel}</dd>
        {view && (
          <>
            <dt className="text-white/50">{t("bataillecorseDebugMySeatLabel")}</dt>
            <dd data-id="bataillecorse-debug-my-seat-value">{view.mySeat}</dd>
            <dt className="text-white/50">{t("bataillecorseDebugPhaseLabel")}</dt>
            <dd data-id="bataillecorse-debug-phase-value">{view.phase}</dd>
            <dt className="text-white/50">{t("bataillecorseDebugTurnLabel")}</dt>
            <dd data-id="bataillecorse-debug-turn-value">{view.turn}</dd>
          </>
        )}
      </dl>
      <p className="mb-1 font-bold uppercase tracking-wide text-white/60">{t("bataillecorseDebugMovesTitle")}</p>
      {log.length === 0 ? (
        <p className="text-white/40" data-id="bataillecorse-debug-log-empty">
          {t("bataillecorseDebugMovesEmpty")}
        </p>
      ) : (
        <ul className="space-y-0.5" data-id="bataillecorse-debug-log">
          {[...log].reverse().map((entry) => (
            <li key={entry.id} data-id={`bataillecorse-debug-log-entry-${entry.id}`}>
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
