"use client";

import { useEffect, useState } from "react";
import {
  isBataillecorseDebugModeEnabled,
  setBataillecorseDebugModeEnabled,
} from "@/lib/client/bataillecorseDebugMode";
import { HUB_URL } from "@/lib/client/hubUrl";
import { useI18n } from "@/lib/client/i18n";
import { getMatchResultStats, type MatchResultStats } from "@/lib/client/matchResultStats";
import { RulesModal } from "./RulesModal";
import type { GameType } from "@/lib/supabase/types";

/** Back-to-hub + settings (language, rules) controls shown on every home splash
 *  screen (`/`, `/coinche`, `/bouilla`, `/president`, `/bataillecorse`) - the
 *  same back (top-left) / paramètres (top-right) chrome everywhere, never a
 *  per-game reimplementation (see `AGENTS.md` "shared base" rule). Both sit at
 *  z-20: their sibling content (`splash-actions`, `home-footer-actions`) is
 *  `relative z-10` in the same stacking context, so without a higher z-index
 *  its empty padding/margin area intercepts clicks on these buttons even
 *  though nothing is visibly drawn there.
 *
 *  `game`: when set, adds a "Rules" entry to the settings panel for that
 *  specific game (opens `RulesModal`) - the single access point for rules,
 *  not a separate button elsewhere on the page. Omitted on the game-picker
 *  home screen (`/`), which isn't about one specific game. */
export function HomeTopBar({ game }: { game?: GameType }) {
  const { locale, setLocale, t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [stats, setStats] = useState<MatchResultStats | null>(null);
  // La Bataille Corse-only debug toggle (see `BataillecorseDebugOverlay.tsx`) -
  // lives in this shared settings panel rather than a per-game duplicate
  // control, gated the same way as the "Rules" button below.
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // Post-hydration browser read, refreshed on every open: mirrors the
    // localStorage-read-in-effect precedent used elsewhere in this app.
    if (!settingsOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getMatchResultStats());
    if (game === "bataillecorse") {
      setDebugMode(isBataillecorseDebugModeEnabled());
    }
  }, [settingsOpen, game]);

  function onDebugModeChange(checked: boolean) {
    setDebugMode(checked);
    setBataillecorseDebugModeEnabled(checked);
  }

  return (
    <>
      <a
        href={HUB_URL}
        className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm"
        data-id="home-back"
        aria-label={t("backToHub")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </a>

      <button
        type="button"
        onClick={() => setSettingsOpen((open) => !open)}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm"
        data-id="home-settings-button"
        aria-label={t("settings")}
        aria-expanded={settingsOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {settingsOpen && (
        <div
          className="absolute right-4 top-16 z-20 w-40 rounded-2xl bg-[var(--surface-overlay)] p-2 shadow-lg ring-1 ring-[var(--accent-cyan)]/25"
          data-id="home-settings-panel"
        >
          <p className="mb-1 px-1 text-xs font-bold uppercase tracking-wide text-[var(--card-face)]/60">
            {t("language")}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              data-id="home-settings-lang-fr"
              onClick={() => setLocale("fr")}
              aria-pressed={locale === "fr"}
              className={`flex-1 rounded-xl px-2 py-1.5 text-sm font-bold ${
                locale === "fr" ? "bg-[var(--accent-yellow)] text-[var(--surface)]" : "bg-black/10 text-[var(--card-face)]/70"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              data-id="home-settings-lang-en"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`flex-1 rounded-xl px-2 py-1.5 text-sm font-bold ${
                locale === "en" ? "bg-[var(--accent-yellow)] text-[var(--surface)]" : "bg-black/10 text-[var(--card-face)]/70"
              }`}
            >
              EN
            </button>
          </div>

          <p className="mb-1 mt-2 px-1 text-xs font-bold uppercase tracking-wide text-[var(--card-face)]/60">
            {t("myStats")}
          </p>
          <p className="px-1 text-sm font-bold text-[var(--card-face)]" data-id="home-settings-stats">
            {t("winsCount")} {stats?.wins ?? 0} · {t("lossesCount")} {stats?.losses ?? 0}
          </p>

          {game && (
            <button
              type="button"
              data-id="home-settings-rules-button"
              onClick={() => {
                setSettingsOpen(false);
                setRulesOpen(true);
              }}
              className="mt-2 w-full rounded-xl bg-black/10 px-2 py-1.5 text-sm font-bold text-[var(--card-face)]"
            >
              {t("rulesButton")}
            </button>
          )}

          {game === "bataillecorse" && (
            <label
              className="mt-2 flex w-full items-center gap-2 rounded-xl bg-black/10 px-2 py-1.5 text-sm font-bold text-[var(--card-face)]"
              data-id="bataillecorse-debug-mode-row"
            >
              <input
                type="checkbox"
                data-id="bataillecorse-debug-mode-checkbox"
                checked={debugMode}
                onChange={(e) => onDebugModeChange(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent-orange)]"
              />
              {/* Deliberately English-only, always - a developer diagnostic
                  toggle, never gameplay copy (see `BataillecorseDebugOverlay.tsx`). */}
              Debug mode
            </label>
          )}
        </div>
      )}

      {rulesOpen && game && <RulesModal game={game} onClose={() => setRulesOpen(false)} />}
    </>
  );
}
