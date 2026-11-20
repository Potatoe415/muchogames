"use client";

import { useI18n } from "@/lib/client/i18n";
import { cardId, type Card, type PlayedCard, type Suit, type Trick } from "@/lib/coinche";
import { SEAT_LABEL } from "@/lib/learn/coach";
import { tr } from "@/lib/learn/types";
import { SUIT_SYMBOL } from "../labels";
import { PlayingCard } from "../PlayingCard";
import { CompletedTrickHold, PlayedCardStage, type TableSeats } from "../TrickStage";

/** You are seat 0 at the bottom; seats go clockwise like the real table. */
const SEATS: TableSeats = { top: 2, left: 3, right: 1, bottom: 0 };

const bySeat = (cards: PlayedCard[]) => new Map(cards.map((p) => [p.seat as number, p.card]));

/** Mini table reusing the real one's trick stage: played cards slide in from each
 *  seat, a finished trick gathers and flies to its winner. */
export function TutorialTable({
  trump,
  current,
  held,
  turn,
  hand,
  legal,
  hintId,
  shakeId,
  onTap,
}: {
  trump: Suit;
  current: PlayedCard[];
  held: Trick | null;
  turn: number | null;
  hand: Card[];
  legal: Set<string>;
  hintId?: string | null;
  shakeId?: string | null;
  onTap: (card: Card) => void;
}) {
  const { locale } = useI18n();
  const label = (seat: number, className: string) => (
    <span
      className={`absolute z-20 rounded-full px-2 py-0.5 text-[0.7rem] font-black text-[var(--surface)] ${seat % 2 === 0 ? "bg-[var(--team-a)]" : "bg-[var(--team-b)]"} ${turn === seat ? "learn-pulse ring-2 ring-white" : ""} ${className}`}
      data-id={`learn-seat-${seat}`}
    >
      {tr(SEAT_LABEL[seat], locale)}
    </span>
  );
  return (
    <div className="flex flex-col gap-2" data-id="learn-table">
      {/* Smaller played cards than the full-screen table so the 4 trick slots fit this box. */}
      <div className="relative h-[22rem] overflow-hidden rounded-[2rem] bg-felt shadow-inner [--card-lg-w:3.25rem]">
        <span className="absolute left-3 top-3 z-20 rounded-full bg-black/45 px-2 py-0.5 text-xs font-black text-[var(--card-face)]" data-id="learn-table-trump">
          {locale === "fr" ? "Atout" : "Trump"} {SUIT_SYMBOL[trump]}
        </span>
        {label(2, "left-1/2 top-3 -translate-x-1/2")}
        {label(3, "left-1 top-[30%]")}
        {label(1, "right-1 top-[30%]")}
        {label(0, "bottom-2 left-1/2 -translate-x-1/2")}
        <PlayedCardStage seats={SEATS} trickBySeat={bySeat(current)} />
        {held && <CompletedTrickHold key={held.cards.map((p) => cardId(p.card)).join()} seats={SEATS} trickBySeat={bySeat(held.cards)} winner={held.winner ?? null} />}
      </div>
      <Hand hand={hand} legal={legal} hintId={hintId} shakeId={shakeId} onTap={onTap} />
    </div>
  );
}

function Hand({
  hand,
  legal,
  hintId,
  shakeId,
  onTap,
}: {
  hand: Card[];
  legal: Set<string>;
  hintId?: string | null;
  shakeId?: string | null;
  onTap: (card: Card) => void;
}) {
  return (
    <div className="flex justify-center pt-3" data-id="learn-hand">
      {hand.map((card, i) => {
        const id = cardId(card);
        const lift = hintId === id ? "learn-pulse" : shakeId === id ? "learn-shake" : "";
        return (
          <div key={shakeId === id ? `${id}-shake` : id} className={`${i ? "-ml-4" : ""} ${lift}`} style={{ zIndex: i }}>
            <PlayingCard
              card={card}
              size="md"
              playable
              showPlayableRing={legal.has(id)}
              dimmed={legal.size > 0 && !legal.has(id)}
              onClick={() => onTap(card)}
              dataId={`learn-hand-card-${id}`}
            />
          </div>
        );
      })}
    </div>
  );
}
