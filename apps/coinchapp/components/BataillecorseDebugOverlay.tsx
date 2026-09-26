"use client";

import type { PlayerView } from "@/lib/bataillecorse";
import { useBataillecorseDebugLog } from "@/lib/client/useBataillecorseDebugLog";

export type BataillecorseDebugMode = "solo" | "duel" | "online" | "adhoc";

const MODE_LABEL: Record<BataillecorseDebugMode, string> = {
  solo: "Solo (vs bot)",
  duel: "Face to face (2 players)",
  online: "Online",
  adhoc: "Offline (ad-hoc)",
};

/** Left-side, semi-transparent debug HUD for la Bataille Corse - on when the
 *  settings panel's debug checkbox is checked (see `HomeTopBar.tsx`,
 *  `useBataillecorseDebugMode`). Shows which game/match type is running,
 *  then every move as it happens (see `useBataillecorseDebugLog`).
 *  Deliberately English-only, always - a developer diagnostic tool, never
 *  gameplay copy, so it does not follow the app's `useI18n` locale.
 *  Its text is selectable (for copying a repro into a bug report) - a
 *  deliberate exception to "never block a tap on the table underneath"
 *  (see AGENTS.md): this panel only exists at all when the opt-in debug
 *  checkbox is on, so a developer who turned it on already expects it to
 *  intercept taps in its own small corner. */
export function BataillecorseDebugOverlay({ mode, view }: { mode: BataillecorseDebugMode; view: PlayerView | null }) {
  const log = useBataillecorseDebugLog(view);

  return (
    <div
      data-id="bataillecorse-debug-overlay"
      className="fixed left-2 top-2 z-50 max-h-[85vh] w-[min(58vw,220px)] select-text overflow-y-auto rounded-xl bg-black/60 p-2 text-[10px] leading-tight text-white/90 shadow-xl ring-1 ring-white/15 backdrop-blur"
    >
      <p className="mb-1 font-bold uppercase tracking-wide text-white/60">Debug</p>
      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5" data-id="bataillecorse-debug-info">
        <dt className="text-white/50">Game</dt>
        <dd data-id="bataillecorse-debug-game-value">Corsican Slap</dd>
        <dt className="text-white/50">Match type</dt>
        <dd data-id="bataillecorse-debug-mode-value">{MODE_LABEL[mode]}</dd>
        {view && (
          <>
            <dt className="text-white/50">My seat</dt>
            <dd data-id="bataillecorse-debug-my-seat-value">{view.mySeat}</dd>
            <dt className="text-white/50">Phase</dt>
            <dd data-id="bataillecorse-debug-phase-value">{view.phase}</dd>
            <dt className="text-white/50">Turn</dt>
            <dd data-id="bataillecorse-debug-turn-value">{view.turn}</dd>
          </>
        )}
      </dl>
      <p className="mb-1 font-bold uppercase tracking-wide text-white/60">Moves played</p>
      {log.length === 0 ? (
        <p className="text-white/40" data-id="bataillecorse-debug-log-empty">
          No move yet.
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
