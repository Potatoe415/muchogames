"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { GameSettingsPanel, DEFAULT_GAME_SETUP } from "@/components/GameSettingsPanel";
import type { GameSetupValues } from "@/components/GameSettingsPanel";
import {
  LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY,
  LOCAL_BATAILLECORSE_STORAGE_KEY,
  LOCAL_BOUILLA_STORAGE_KEY,
  LOCAL_COINCHE_STORAGE_KEY,
  LOCAL_PRESIDENT_STORAGE_KEY,
  clearPersistedGame,
} from "@/lib/client/localGamePersistence";

export default function LocalSetupPage() {
  return (
    <Suspense>
      <LocalSetupPageInner />
    </Suspense>
  );
}

function LocalSetupPageInner() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const game = searchParams.get("game");
  const isBouilla = game === "bouilla";
  const isPresident = game === "president";
  const isBataillecorse = game === "bataillecorse";
  const [setup, setSetup] = useState<GameSetupValues>(DEFAULT_GAME_SETUP);
  // La Bataille Corse-only: same device, either a bot opponent or a second
  // real human sitting on the other side of the phone (see docs/DECISIONS.md).
  // Defaults to "duel" when arriving from the home screen's dedicated
  // "Jouer face à face" button (`?mode=duel`), still switchable here.
  const [bataillecorseMode, setBataillecorseMode] = useState<"bot" | "duel">(
    searchParams.get("mode") === "duel" ? "duel" : "bot",
  );
  const isDuel = isBataillecorse && bataillecorseMode === "duel";

  function startLocalGame() {
    // A deliberate "start" from setup always begins a fresh match: clear any
    // abandoned in-progress save so it can't get resumed by mistake.
    clearPersistedGame(LOCAL_COINCHE_STORAGE_KEY);
    clearPersistedGame(LOCAL_BOUILLA_STORAGE_KEY);
    clearPersistedGame(LOCAL_PRESIDENT_STORAGE_KEY);
    clearPersistedGame(LOCAL_BATAILLECORSE_STORAGE_KEY);
    clearPersistedGame(LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY);
    if (isBouilla) {
      router.push(`/local/play?game=bouilla&botThinkMs=${setup.botThinkMs}`);
      return;
    }
    if (isPresident) {
      router.push(`/local/play?game=president&botThinkMs=${setup.botThinkMs}&roundsToPlay=${setup.roundsToPlay}`);
      return;
    }
    if (isDuel) {
      router.push(`/local/play?game=bataillecorse&mode=duel&deckSize=${setup.bataillecorseDeckSize}`);
      return;
    }
    if (isBataillecorse) {
      router.push(`/local/play?game=bataillecorse&botThinkMs=${setup.botThinkMs}&deckSize=${setup.bataillecorseDeckSize}`);
      return;
    }
    const params = new URLSearchParams({
      target: String(setup.target),
      countContractOnlyIfMade: String(setup.countContractOnlyIfMade),
      failedContractDefensePoints: setup.failedContractDefensePoints,
      zeroPointsForNonContractingTeamWhenContractMade: String(setup.zeroPointsForNonContractingTeamWhenContractMade),
      capotMadePoints: setup.capotMadePoints,
      capotFailedDefensePoints: setup.capotFailedDefensePoints,
      allowSpecialBids: String(setup.allowToutAtoutSansAtout),
      requireMorePointsToWin: String(setup.requireMorePointsToWin),
      botPunch: setup.botPunch,
      botThinkMs: String(setup.botThinkMs),
    });
    router.push(`/local/play?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8" data-id="local-setup-screen">
      <Link
        href="/"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/20"
        data-id="local-back-home"
        aria-label={t("backToDashboard")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </Link>

      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-[var(--surface)]" data-id="local-title">
          {isBouilla
            ? t("bouillaLocalTitle")
            : isPresident
            ? t("presidentLocalTitle")
            : isDuel
            ? t("bataillecorseDuelTitle")
            : isBataillecorse
            ? t("bataillecorseLocalTitle")
            : t("playLocal")}
        </h1>
        <p className="text-sm text-[var(--foreground)]/75">
          {isBouilla
            ? t("bouillaLocalSubtitle")
            : isPresident
            ? t("presidentLocalSubtitle")
            : isDuel
            ? t("bataillecorseDuelSubtitle")
            : isBataillecorse
            ? t("bataillecorseLocalSubtitle")
            : t("localSubtitle")}
        </p>
      </header>

      {isBataillecorse && (
        <section className="flex flex-col gap-1.5 text-sm" data-id="local-bataillecorse-mode-row">
          <span className="text-[var(--foreground)]/75">{t("bataillecorseModeLabel")}</span>
          <div className="flex gap-2">
            {(["bot", "duel"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-id={`local-bataillecorse-mode-${mode}`}
                onClick={() => setBataillecorseMode(mode)}
                className={[
                  "flex-1 rounded-lg px-3 py-2 font-bold",
                  bataillecorseMode === mode
                    ? "bg-[var(--accent-yellow)] text-[var(--surface)]"
                    : "bg-[var(--foreground)]/10 text-[var(--foreground)]/70",
                ].join(" ")}
              >
                {mode === "bot" ? t("bataillecorseModeBot") : t("bataillecorseModeDuel")}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3" data-id="local-actions-card">
        <button
          data-id="local-start-button"
          onClick={startLocalGame}
          className="rounded-2xl bg-[var(--accent-yellow)] px-4 py-4 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("start")}
        </button>
      </section>

      <GameSettingsPanel
        values={setup}
        onChange={setSetup}
        idPrefix="local"
        title={t("settings")}
        coincheFields={!isBouilla && !isPresident && !isBataillecorse}
        presidentFields={isPresident}
        bataillecorseFields={isBataillecorse}
        hideBotFields={isDuel}
      />
    </main>
  );
}
