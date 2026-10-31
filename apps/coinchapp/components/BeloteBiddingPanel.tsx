"use client";

import { useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import type { BidOptions, Card, Suit } from "@/lib/coinche";
import type { BidPayload } from "./BiddingPanel";
import { SUIT_SYMBOL, isRedSuit } from "./labels";
import { PlayingCard } from "./PlayingCard";

/** Belote's take-or-pass panel: first go-round takes the turned suit, second names another. */
export function BeloteBiddingPanel({
  options,
  turnedCard,
  onBid,
}: {
  options: BidOptions;
  turnedCard: Card;
  onBid: (payload: BidPayload) => Promise<void> | void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const firstRound = options.suits.length === 1 && options.suits[0] === turnedCard.suit;

  async function send(payload: BidPayload) {
    setBusy(true);
    try {
      await onBid(payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-id="belote-bidding-panel">
      <p className="text-center text-sm text-[var(--card-face)]/70" data-id="belote-bidding-prompt">
        {firstRound ? t("beloteTakePrompt") : t("beloteNamePrompt")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {(options.suits as Suit[]).map((suit) => (
          <button
            key={suit}
            data-id={`belote-take-${suit}`}
            disabled={busy}
            onClick={() => send({ type: "bid", suit })}
            className={`flex h-12 min-w-12 items-center justify-center gap-1 rounded-lg bg-[var(--card-face)] px-3 font-black disabled:opacity-50 ${
              isRedSuit(suit) ? "text-[var(--accent-red)]" : "text-[var(--card-ink)]"
            }`}
          >
            {firstRound && <span className="text-base">{t("beloteTake")}</span>}
            <span className="text-2xl">{SUIT_SYMBOL[suit]}</span>
          </button>
        ))}
        {options.canPass && (
          <button
            data-id="bid-pass-button"
            disabled={busy}
            onClick={() => send({ type: "pass" })}
            className="h-12 rounded-lg bg-[var(--card-face)]/14 px-5 font-bold disabled:opacity-50"
          >
            {t("pass")}
          </button>
        )}
      </div>
    </div>
  );
}

/** The face-up card in the middle of the table while players take or pass. */
export function BeloteTurnedCard({ card }: { card: Card }) {
  const { t } = useI18n();
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[38%] z-10 flex -translate-x-1/2 flex-col items-center gap-1"
      data-id="belote-turned-card"
    >
      <PlayingCard card={card} size="md" />
      <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-[var(--card-face)]">
        {t("beloteTurnedCard")}
      </span>
    </div>
  );
}
