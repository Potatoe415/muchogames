"use client";

import { useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { cardId, type Card, type Suit } from "@/lib/coinche";
import { cardTip } from "@/lib/learn/coach";
import { PlayingCard } from "../PlayingCard";

/** Coach speech bubble. `tone` colors the border: hint, right or wrong. */
export function CoachBubble({
  children,
  tone = "hint",
  dataId,
}: {
  children: React.ReactNode;
  tone?: "hint" | "good" | "bad";
  dataId: string;
}) {
  const ring = tone === "good" ? "ring-[var(--accent-green)]" : tone === "bad" ? "ring-[var(--accent-red)]" : "ring-[var(--accent-cyan)]";
  return (
    <div
      key={String(children)}
      data-id={dataId}
      role="status"
      className={`learn-pop flex items-start gap-2 rounded-2xl bg-[var(--surface-overlay)] p-3 text-sm text-[var(--card-face)] shadow-lg ring-2 ${ring}`}
    >
      <span aria-hidden className="text-xl leading-none">
        {tone === "good" ? "✅" : tone === "bad" ? "❌" : "💡"}
      </span>
      <p className="whitespace-pre-line">{children}</p>
    </div>
  );
}

/** A row of cards dealt in one by one; tapping a card shows its points tooltip. */
export function CardRow({ cards, trump, dataId }: { cards: Card[]; trump?: Suit; dataId: string }) {
  const { locale } = useI18n();
  const [tapped, setTapped] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-2" data-id={dataId}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {cards.map((card, i) => {
          const id = cardId(card);
          return (
            <div key={id} className="learn-deal-in relative" style={{ animationDelay: `${i * 90}ms` }}>
              <PlayingCard card={card} size="md" playable showPlayableRing={tapped === id} onClick={() => setTapped(id)} dataId={`${dataId}-card-${id}`} />
            </div>
          );
        })}
      </div>
      <p
        key={tapped ?? "none"}
        className="learn-pop min-h-[1.5rem] rounded-full bg-black/45 px-3 py-0.5 text-sm font-bold text-[var(--card-face)]"
        data-id={`${dataId}-tooltip`}
      >
        {tapped
          ? cardTip(cards.find((c) => cardId(c) === tapped)!, trump, locale)
          : locale === "fr"
            ? "👆 Touchez une carte"
            : "👆 Tap a card"}
      </p>
    </div>
  );
}
