"use client";

import type { ReactNode } from "react";
import { SUITS, type Suit } from "@/lib/cards";
import { isSamePile, type GameState, type PileRef, type Target, type TableauCard } from "@/lib/solitaire";
import { CardBack, PlayingCard } from "./PlayingCard";

const CARD_H = "calc(var(--card-md-w) * 1.5)";
const FACE_DOWN_STEP = 0.2;
const FACE_UP_STEP = 0.5;
const SUIT_SYMBOL: Record<Suit, string> = { H: "\u2665", D: "\u2666", C: "\u2663", S: "\u2660" };
const TARGET_RING = "rounded-lg ring-4 ring-[var(--accent-cyan)]";

export interface PilesProps {
  state: GameState;
  selection: PileRef | null;
  targets: Target[];
  onTap: (pile: PileRef) => void;
  labels: { draw: string; redeal: string; foundation: string; emptyColumn: string };
}

function isTarget(targets: Target[], target: Target): boolean {
  return targets.some((legal) => isSamePile(legal, target));
}

/** A card-sized dashed outline: an empty pile, tappable when given `onClick`. */
function EmptySlot({ label, dataId, highlighted, onClick, children }: {
  label: string;
  dataId: string;
  highlighted?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-id={dataId}
      onClick={onClick}
      style={{ width: "var(--card-md-w)", height: CARD_H }}
      className={`flex items-center justify-center rounded-lg border-2 border-dashed border-white/35 text-[calc(var(--card-md-w)*0.5)] font-black text-white/35 ${highlighted ? TARGET_RING : ""}`}
    >
      {children}
    </button>
  );
}

function Stock({ state, onDraw, labels }: { state: GameState; onDraw: () => void; labels: PilesProps["labels"] }) {
  if (state.stock.length === 0) {
    return (
      <EmptySlot label={labels.redeal} dataId="solitaire-stock-redeal-button" onClick={onDraw}>
        {state.waste.length > 0 ? "\u21bb" : ""}
      </EmptySlot>
    );
  }
  return (
    <button type="button" aria-label={labels.draw} data-id="solitaire-stock-button" onClick={onDraw}>
      <CardBack dataId="solitaire-stock-card" />
    </button>
  );
}

/** The waste's top card, plus (draw 3) the two under it fanned to its left. */
function Waste({ state, selection, onTap }: Pick<PilesProps, "state" | "selection" | "onTap">) {
  const shown = state.waste.slice(-state.drawCount);
  if (shown.length === 0) return <div style={{ width: "var(--card-md-w)", height: CARD_H }} data-id="solitaire-waste-empty" />;
  return (
    <div className="relative" style={{ width: "calc(var(--card-md-w) * 1.6)", height: CARD_H }} data-id="solitaire-waste">
      {shown.map((card, i) => {
        const isTop = i === shown.length - 1;
        return (
          <div key={`${card.rank}${card.suit}`} className="absolute top-0" style={{ left: `calc(var(--card-md-w) * ${0.3 * i})` }}>
            <PlayingCard
              card={card}
              playable={isTop}
              showPlayableRing={isTop && selection?.kind === "waste"}
              onClick={isTop ? () => onTap({ kind: "waste" }) : undefined}
              dataId={isTop ? "solitaire-waste-top-card" : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

function Foundation({ suit, state, selection, targets, onTap, labels }: PilesProps & { suit: Suit }) {
  const top = state.foundations[suit].at(-1);
  const pile: PileRef = { kind: "foundation", suit };
  const highlighted = isTarget(targets, pile);
  if (!top) {
    return (
      <EmptySlot label={`${labels.foundation} ${SUIT_SYMBOL[suit]}`} dataId={`solitaire-foundation-${suit}`} highlighted={highlighted} onClick={() => onTap(pile)}>
        {SUIT_SYMBOL[suit]}
      </EmptySlot>
    );
  }
  return (
    <div className={highlighted ? TARGET_RING : ""}>
      <PlayingCard
        card={top}
        playable
        showPlayableRing={selection?.kind === "foundation" && selection.suit === suit}
        onClick={() => onTap(pile)}
        dataId={`solitaire-foundation-${suit}`}
      />
    </div>
  );
}

/** `foundationsHidden`: the win cascade repaints the foundations itself. */
export function TopRow({ onDraw, foundationsHidden, ...props }: PilesProps & { onDraw: () => void; foundationsHidden: boolean }) {
  return (
    <div className="flex items-start justify-between" data-id="solitaire-top-row">
      <div className="flex gap-[calc(var(--card-md-w)*0.08)]">
        <Stock state={props.state} onDraw={onDraw} labels={props.labels} />
        <Waste state={props.state} selection={props.selection} onTap={props.onTap} />
      </div>
      <div
        className="flex gap-[calc(var(--card-md-w)*0.08)]"
        style={foundationsHidden ? { visibility: "hidden" } : undefined}
        data-id="solitaire-foundations"
      >
        {SUITS.map((suit) => (
          <Foundation key={suit} suit={suit} {...props} />
        ))}
      </div>
    </div>
  );
}

function cardTops(column: TableauCard[]): number[] {
  let offset = 0;
  return column.map((entry) => {
    const top = offset;
    offset += entry.faceUp ? FACE_UP_STEP : FACE_DOWN_STEP;
    return top;
  });
}

function TableauColumn({ col, column, selection, targets, onTap, labels }: Omit<PilesProps, "state"> & { col: number; column: TableauCard[] }) {
  const highlighted = isTarget(targets, { kind: "tableau", col });
  if (column.length === 0) {
    return <EmptySlot label={labels.emptyColumn} dataId={`solitaire-tableau-${col}-empty`} highlighted={highlighted} onClick={() => onTap({ kind: "tableau", col })} />;
  }
  const tops = cardTops(column);
  const selectedFrom = selection?.kind === "tableau" && selection.col === col ? selection.index ?? column.length - 1 : null;
  return (
    <div
      className="relative"
      style={{ width: "var(--card-md-w)", height: `calc(var(--card-md-w) * ${1.5 + tops[tops.length - 1]})` }}
      onClick={selection ? () => onTap({ kind: "tableau", col }) : undefined}
      data-id={`solitaire-tableau-${col}`}
    >
      {column.map((entry, index) => (
        <div
          key={`${entry.card.rank}${entry.card.suit}`}
          className={`absolute left-0 ${highlighted && index === column.length - 1 ? TARGET_RING : ""}`}
          style={{ top: `calc(var(--card-md-w) * ${tops[index]})` }}
          onClick={entry.faceUp ? (event) => event.stopPropagation() : undefined}
        >
          {entry.faceUp ? (
            <PlayingCard
              card={entry.card}
              playable
              showPlayableRing={selectedFrom !== null && index >= selectedFrom}
              onClick={() => onTap({ kind: "tableau", col, index })}
              dataId={`solitaire-tableau-${col}-card-${index}`}
            />
          ) : (
            <CardBack dataId={`solitaire-tableau-${col}-card-${index}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function Tableau(props: PilesProps) {
  return (
    <div className="flex items-start justify-between" data-id="solitaire-tableau">
      {props.state.tableau.map((column, col) => (
        <TableauColumn key={col} col={col} column={column} {...props} />
      ))}
    </div>
  );
}
