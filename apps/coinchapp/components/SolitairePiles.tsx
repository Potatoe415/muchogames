"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { SUITS, type Suit } from "@/lib/cards";
import { isSamePile, type GameState, type PileRef, type Target, type TableauCard } from "@/lib/solitaire";
import { CardBack, PlayingCard } from "./PlayingCard";
import { dropKey, type DragState } from "./useSolitaireDrag";

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
  drag: DragState | null;
  onDragStart: (pile: PileRef, event: ReactPointerEvent) => void;
  labels: { draw: string; redeal: string; foundation: string; emptyColumn: string };
}

function isTarget(targets: Target[], target: Target): boolean {
  return targets.some((legal) => isSamePile(legal, target));
}

/** A pressable card: starts a drag, and follows the pointer while dragged. */
function draggableProps(props: Pick<PilesProps, "drag" | "onDragStart">, pile: PileRef, dragged: boolean) {
  const style: CSSProperties = { touchAction: "none" };
  if (dragged && props.drag) {
    style.transform = `translate(${props.drag.dx}px, ${props.drag.dy}px)`;
    style.zIndex = 50;
  }
  return { style, onPointerDown: (event: ReactPointerEvent) => props.onDragStart(pile, event) };
}

/** A card-sized dashed outline: an empty pile, tappable when given `onClick`,
 *  and a drag-and-drop landing zone when given `drop`. */
function EmptySlot({ label, dataId, highlighted, onClick, drop, children }: {
  label: string;
  dataId: string;
  highlighted?: boolean;
  onClick?: () => void;
  drop?: Target;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-id={dataId}
      data-drop={drop ? dropKey(drop) : undefined}
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
function Waste({ state, selection, onTap, drag, onDragStart }: Pick<PilesProps, "state" | "selection" | "onTap" | "drag" | "onDragStart">) {
  const shown = state.waste.slice(-state.drawCount);
  if (shown.length === 0) return <div style={{ width: "var(--card-md-w)", height: CARD_H }} data-id="solitaire-waste-empty" />;
  return (
    <div className="relative" style={{ width: "calc(var(--card-md-w) * 1.6)", height: CARD_H }} data-id="solitaire-waste">
      {shown.map((card, i) => {
        const isTop = i === shown.length - 1;
        const left = { left: `calc(var(--card-md-w) * ${0.3 * i})` };
        const dragProps = isTop ? draggableProps({ drag, onDragStart }, { kind: "waste" }, drag?.from.kind === "waste") : null;
        return (
          <div
            key={`${card.rank}${card.suit}`}
            className="absolute top-0"
            style={{ ...left, ...dragProps?.style }}
            onPointerDown={dragProps?.onPointerDown}
          >
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

function Foundation({ suit, state, selection, targets, onTap, labels, ...dragging }: PilesProps & { suit: Suit }) {
  const top = state.foundations[suit].at(-1);
  const pile: Target & PileRef = { kind: "foundation", suit };
  const highlighted = isTarget(targets, pile);
  if (!top) {
    return (
      <EmptySlot label={`${labels.foundation} ${SUIT_SYMBOL[suit]}`} dataId={`solitaire-foundation-${suit}`} highlighted={highlighted} onClick={() => onTap(pile)} drop={pile}>
        {SUIT_SYMBOL[suit]}
      </EmptySlot>
    );
  }
  const dragged = dragging.drag?.from.kind === "foundation" && dragging.drag.from.suit === suit;
  const { style, onPointerDown } = draggableProps(dragging, pile, dragged);
  return (
    <div className={`relative ${highlighted ? TARGET_RING : ""}`} data-drop={dropKey(pile)} style={style} onPointerDown={onPointerDown}>
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
        <Waste {...props} />
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

/** Index the dragged run starts at when it comes from column `col`. */
function draggedFrom(drag: DragState | null, col: number, columnLength: number): number | null {
  if (drag?.from.kind !== "tableau" || drag.from.col !== col) return null;
  return drag.from.index ?? columnLength - 1;
}

function TableauColumn({ col, column, selection, targets, onTap, labels, ...dragging }: Omit<PilesProps, "state"> & { col: number; column: TableauCard[] }) {
  const target: Target = { kind: "tableau", col };
  const highlighted = isTarget(targets, target);
  if (column.length === 0) {
    return <EmptySlot label={labels.emptyColumn} dataId={`solitaire-tableau-${col}-empty`} highlighted={highlighted} onClick={() => onTap(target)} drop={target} />;
  }
  const tops = cardTops(column);
  const selectedFrom = selection?.kind === "tableau" && selection.col === col ? selection.index ?? column.length - 1 : null;
  const dragFrom = draggedFrom(dragging.drag, col, column.length);
  return (
    <div
      className="relative"
      style={{ width: "var(--card-md-w)", height: `calc(var(--card-md-w) * ${1.5 + tops[tops.length - 1]})` }}
      onClick={selection ? () => onTap(target) : undefined}
      data-id={`solitaire-tableau-${col}`}
      data-drop={dropKey(target)}
    >
      {column.map((entry, index) => {
        const dragProps = entry.faceUp ? draggableProps(dragging, { kind: "tableau", col, index }, dragFrom !== null && index >= dragFrom) : null;
        return (
          <div
            key={`${entry.card.rank}${entry.card.suit}`}
            className={`absolute left-0 ${highlighted && index === column.length - 1 ? TARGET_RING : ""}`}
            style={{ top: `calc(var(--card-md-w) * ${tops[index]})`, ...dragProps?.style }}
            onPointerDown={dragProps?.onPointerDown}
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
        );
      })}
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
