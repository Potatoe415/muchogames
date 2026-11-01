"use client";

import type { CSSProperties } from "react";
import type { CardOf, Suit } from "@/lib/cards";
import { faceRank } from "@/lib/client/cardFace";
import { useI18n } from "@/lib/client/i18n";

const SUIT_SYMBOL: Record<Suit, string> = { H: "\u2665", D: "\u2666", C: "\u2663", S: "\u2660" };
const RED_SUITS: Suit[] = ["H", "D"];

export type CardSize = "xs" | "sm" | "md" | "lg";

const CARD_WIDTH: Record<CardSize, string> = {
  xs: "var(--card-xs-w)",
  sm: "var(--card-sm-w)",
  md: "var(--card-md-w)",
  lg: "var(--card-lg-w)",
};

function cardBoxStyle(size: CardSize): CSSProperties {
  const width = CARD_WIDTH[size];
  return {
    width,
    height: `calc(${width} * 1.5)`,
    aspectRatio: "2 / 3",
    fontSize: `calc(${width} * 0.28)`,
  };
}

/** Any game's card shape (rank set differs per game, suit set is universal). */
export interface PlayingCardProps {
  card: CardOf<string>;
  size?: CardSize;
  dimmed?: boolean;
  playable?: boolean;
  /** Suppresses `playable`'s always-on gold ring while keeping the card
   *  clickable (e.g. the exchange panel, where every card is clickable but
   *  only the ones the player actually selected should be highlighted).
   *  Defaults to true. */
  showPlayableRing?: boolean;
  /** Also mirrors the rank/suit corner index on the top-right (in addition to
   *  the always-on top-left one). Used where a card sits partly behind
   *  another one offset to the left (e.g. la Bataille Corse's scattered
   *  pile, `BataillecorseTable.tsx`) - whichever side peeks out, its rank/suit
   *  stays readable. Defaults to false (every other game's plain look). */
  showRightIndex?: boolean;
  onClick?: () => void;
  dataId?: string;
}

export function PlayingCard({
  card,
  size = "md",
  dimmed,
  playable,
  showPlayableRing = true,
  showRightIndex = false,
  onClick,
  dataId,
}: PlayingCardProps) {
  const { locale } = useI18n();
  const label = faceRank(card.rank, locale);
  const red = RED_SUITS.includes(card.suit);
  const interactive = !!onClick;
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? !playable : undefined}
      data-id={dataId}
      data-card={`${card.rank}${card.suit}`}
      style={cardBoxStyle(size)}
      className={[
        "relative overflow-hidden rounded-lg border-2 border-[var(--card-ink)] bg-[var(--card-face)] font-black shadow-[0_2px_0_rgba(32,40,58,0.65)] select-none",
        red ? "text-[var(--accent-red)]" : "text-[var(--card-ink)]",
        dimmed ? "brightness-50 grayscale" : "",
        playable ? "cursor-pointer" : "",
        playable && showPlayableRing ? "ring-4 ring-[var(--ring-strong)]" : "",
        interactive && !playable ? "cursor-not-allowed" : "",
        "transition-transform",
      ].join(" ")}
    >
      <CornerIndex rank={label} suit={card.suit} side="left" />
      {showRightIndex && <CornerIndex rank={label} suit={card.suit} side="right" />}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[35%] text-[2.2em] leading-none">
        {SUIT_SYMBOL[card.suit]}
      </span>
    </Tag>
  );
}

function CornerIndex({ rank, suit, side }: { rank: string; suit: Suit; side: "left" | "right" }) {
  const pos = side === "left" ? "left-[8%]" : "right-[8%]";
  return (
    <div className={`absolute top-[6%] ${pos} flex flex-col items-center leading-none`}>
      <span className="font-black leading-none">{rank}</span>
      <span className="text-[0.9em] leading-none">{SUIT_SYMBOL[suit]}</span>
    </div>
  );
}

export function CardBack({ size = "md", dataId }: { size?: CardSize; dataId?: string }) {
  return (
    <div
      data-id={dataId}
      style={cardBoxStyle(size)}
      className="relative overflow-hidden rounded-lg border-[0.5px] border-[var(--card-ink)] bg-[var(--card-back)] shadow-[0_2px_0_rgba(32,40,58,0.75)]"
    >
      <div className="absolute inset-[8%] rounded-sm border-[0.5px] border-[var(--card-back-line)]/60" />
    </div>
  );
}
