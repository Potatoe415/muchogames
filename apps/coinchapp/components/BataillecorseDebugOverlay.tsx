"use client";

import { useEffect, useRef } from "react";
import type { PlayerView } from "@/lib/bataillecorse";
import type { BataillecorseDebugLogEntry } from "@/lib/client/useBataillecorseDebugLog";

export type BataillecorseDebugMode = "solo" | "duel" | "online" | "adhoc";

const MODE_LABEL: Record<BataillecorseDebugMode, string> = {
  solo: "Solo (vs bot)",
  duel: "Face to face (2 players)",
  online: "Online",
  adhoc: "Offline (ad-hoc)",
};

/** Left-side, semi-transparent debug HUD for la Bataille Corse - revealed by
 *  the in-game "Info partie" button (`GameInfoButton`/`panelOpen` in
 *  `BataillecorseTable`/`BataillecorseDuelTable`) whenever the settings
 *  panel's debug checkbox is checked (see `HomeTopBar.tsx`,
 *  `useBataillecorseDebugMode`). Shows which game/match type is running,
 *  then every move as it happened. Purely presentational: `log` is tracked
 *  by the caller's own `useBataillecorseDebugLog(view)` call, kept running
 *  for the whole match regardless of whether this overlay is currently
 *  shown - closing "Info partie" must never lose earlier moves.
 *  Deliberately English-only, always - a developer diagnostic tool, never
 *  gameplay copy, so it does not follow the app's `useI18n` locale.
 *  Its text is selectable (for copying a repro into a bug report) - a
 *  deliberate exception to "never block a tap on the table underneath"
 *  (see AGENTS.md): this panel only exists at all when the opt-in debug
 *  checkbox is on and "Info partie" is open, so a developer who got here
 *  already expects it to intercept taps in its own small corner. */
export function BataillecorseDebugOverlay({
  mode,
  view,
  log,
}: {
  mode: BataillecorseDebugMode;
  view: PlayerView | null;
  log: BataillecorseDebugLogEntry[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Entries append oldest-first (chronological reading order, see
  // `useBataillecorseDebugLog`), so keep the newest one in view instead of
  // making a developer scroll down every time a move is played.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div
      ref={scrollRef}
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
          {log.map((entry) => (
            <li key={entry.id} data-id={`bataillecorse-debug-log-entry-${entry.id}`}>
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
