"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { useMatchCoin, type MatchInfo } from "@/lib/client/matchCoin";

/**
 * Platform rules shared by every table (root docs/PLATFORM_RULES.md): one
 * hub coin per match, the out-of-coins dialog, and "Quitter la partie ?"
 * before a back button (`data-id="game-back-button"`) leaves a match in
 * progress. Rendered by `TableShell` when given a `match`.
 */
export function MatchGate({ match }: { match: MatchInfo }) {
  const { t } = useI18n();
  const router = useRouter();
  const outOfCoins = useMatchCoin(match);
  const [pendingBack, setPendingBack] = useState<string | null>(null);
  const inProgress = match.status === "playing" && match.seated;

  useEffect(() => {
    if (!inProgress) return;
    const intercept = (event: MouseEvent) => {
      const back = (event.target as Element | null)?.closest?.('[data-id="game-back-button"]');
      if (!(back instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingBack(back.href);
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [inProgress]);

  if (outOfCoins) {
    return (
      <MatchDialog
        dataId="out-of-coins-dialog"
        message={t("outOfCoins")}
        confirm="OK"
        onConfirm={() => router.push(`/${match.game}`)}
      />
    );
  }
  if (pendingBack) {
    return (
      <MatchDialog
        dataId="quit-match-dialog"
        message={t("quitMatch")}
        confirm={t("quitMatchLeave")}
        onConfirm={() => window.location.assign(pendingBack)}
        cancel={t("quitMatchStay")}
        onCancel={() => setPendingBack(null)}
      />
    );
  }
  return null;
}

function MatchDialog({
  dataId,
  message,
  confirm,
  onConfirm,
  cancel,
  onCancel,
}: {
  dataId: string;
  message: string;
  confirm: string;
  onConfirm: () => void;
  cancel?: string;
  onCancel?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      role="alertdialog"
      aria-modal="true"
      data-id={dataId}
    >
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-5 text-center shadow-xl ring-2 ring-[var(--accent-yellow)]">
        <p className="mb-4 text-base font-bold text-[var(--card-face)]" data-id={`${dataId}-message`}>
          {message}
        </p>
        <div className="flex justify-center gap-3">
          {cancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-[var(--card-face)]/10 px-4 py-2 font-bold text-[var(--card-face)]"
              data-id={`${dataId}-cancel`}
            >
              {cancel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[var(--accent-yellow)] px-4 py-2 font-bold text-[var(--surface)]"
            data-id={`${dataId}-confirm`}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
