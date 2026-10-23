"use client";

import { useState, type CSSProperties } from "react";
import { HUB_URL } from "@/lib/client/hubUrl";
import { formatText, useI18n } from "@/lib/client/i18n";
import { useRecordMatchResult } from "@/lib/client/matchResultStats";
import type { SolitaireActions } from "@/lib/client/useLocalSolitaireGame";
import type { GameState, PileRef, Target } from "@/lib/solitaire";
import { GameInfoButton } from "./GameHud";
import { RulesModal } from "./RulesModal";
import { SOLITAIRE_LABELS } from "./solitaireLabels";
import { Tableau, TopRow } from "./SolitairePiles";
import { TableShell } from "./TableShell";

/** 7 columns (+ gaps) across the width; the tallest possible column (6 face
 *  down + K..A face up) plus the top row and HUD down the height. */
const SCENE_STYLE = {
  "--card-md-w": "min(calc((100vw - 1rem) / 7.5), calc((100svh - 7rem) / 10.5), 6.5rem)",
  width: "calc(var(--card-md-w) * 7.5)",
} as CSSProperties;

export function SolitaireTable({
  state,
  selection,
  targets,
  gameId,
  actions,
  onReset,
}: {
  state: GameState;
  selection: PileRef | null;
  targets: Target[];
  gameId: string;
  actions: SolitaireActions;
  onReset: () => void;
}) {
  const { locale, t } = useI18n();
  const labels = SOLITAIRE_LABELS[locale];
  const [panelOpen, setPanelOpen] = useState(false);
  const piles = { state, selection, targets, onTap: actions.onTap, labels };

  return (
    <TableShell
      dataId="solitaire-table"
      match={{ id: gameId, game: "solitaire", status: state.phase === "finished" ? "finished" : "playing", seated: true }}
    >
      <header className="absolute inset-x-0 top-[var(--table-hud-top)] z-30 flex items-center justify-between px-3">
        <a
          href={HUB_URL}
          aria-label={t("backToHub")}
          data-id="game-back-button"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card-face)] text-5xl font-black leading-none text-[var(--surface)] shadow-lg"
        >
          ‹
        </a>
        <p className="rounded-full bg-[var(--surface-overlay)] px-4 py-1 text-base font-black shadow-lg" data-id="solitaire-moves">
          {labels.moves} : {state.moves}
        </p>
        <GameInfoButton label={t("gameInfo")} onClick={() => setPanelOpen(true)} />
      </header>

      {panelOpen && <SolitaireInfoPanel onReset={onReset} onClose={() => setPanelOpen(false)} />}

      <div className="relative h-0 min-h-0 flex-1" data-id="solitaire-scene">
        <div className="mx-auto flex flex-col gap-[calc(var(--card-md-w)*0.25)] pt-[calc(var(--table-hud-top)+4.75rem)]" style={SCENE_STYLE}>
          <TopRow {...piles} onDraw={actions.onDraw} />
          <Tableau {...piles} />
        </div>
      </div>

      {state.phase === "finished" && <FinishedOverlay gameId={gameId} moves={state.moves} onReset={onReset} />}
    </TableShell>
  );
}

function SolitaireInfoPanel({ onReset, onClose }: { onReset: () => void; onClose: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const [rulesOpen, setRulesOpen] = useState(false);
  if (rulesOpen) return <RulesModal game="solitaire" onClose={onClose} />;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-6" data-id="solitaire-info-overlay" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-5 shadow-2xl" data-id="solitaire-info-panel" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 text-center text-lg font-black text-[var(--card-face)]">{t("gameInfo")}</p>
        <div className="mb-3 flex items-center justify-between" data-id="solitaire-language-row">
          <span className="text-sm text-[var(--card-face)]/80">{t("language")}</span>
          <div className="flex gap-1">
            {(["fr", "en"] as const).map((lang) => (
              <button
                key={lang}
                data-id={`solitaire-language-btn-${lang}`}
                onClick={() => setLocale(lang)}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === lang ? "bg-[var(--accent-cyan)] text-[var(--surface)]" : "bg-[var(--card-face)]/10 text-[var(--card-face)]/70"}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button data-id="solitaire-rules-button" onClick={() => setRulesOpen(true)} className="w-full rounded-lg bg-[var(--card-face)]/14 py-2 font-bold text-[var(--card-face)]">
          {t("rulesButton")}
        </button>
        <button
          data-id="solitaire-new-game-button"
          onClick={() => { onReset(); onClose(); }}
          className="mt-2 w-full rounded-lg bg-[var(--accent-red)]/80 py-2 font-bold text-[var(--card-face)]"
        >
          {t("newGame")}
        </button>
        <button data-id="solitaire-info-close-button" onClick={onClose} className="mt-4 w-full rounded-lg bg-[var(--card-face)]/14 py-2 font-bold text-[var(--card-face)]">
          {t("close")}
        </button>
      </div>
    </div>
  );
}

/** Only a solved game is recorded: giving up or starting over never counts
 *  as a loss. */
function FinishedOverlay({ gameId, moves, onReset }: { gameId: string; moves: number; onReset: () => void }) {
  const { t, locale } = useI18n();
  const labels = SOLITAIRE_LABELS[locale];
  useRecordMatchResult(gameId, true, true, "solitaire");
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6" data-id="solitaire-finished-overlay">
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl">
        <p className="mb-1 text-sm font-bold uppercase text-[var(--card-face)]/60">{t("gameFinished")}</p>
        <p className="text-2xl font-black text-[var(--card-face)]" data-id="solitaire-won-title">{labels.won}</p>
        <p className="mb-4 text-sm text-[var(--card-face)]/80" data-id="solitaire-won-moves">{formatText(labels.wonMoves, { moves })}</p>
        <button data-id="solitaire-play-again-button" onClick={onReset} className="w-full rounded-lg bg-[var(--accent-yellow)] py-2 font-bold text-[var(--surface)]">
          {t("newGame")}
        </button>
      </div>
    </div>
  );
}
