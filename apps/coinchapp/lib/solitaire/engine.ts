import { SUITS } from "@/lib/cards";
import { isRed, rankValue } from "./cards";
import type { Card, GameState, PileRef, Target, TableauCard } from "./types";

const FULL_SUIT = 13;

/** Turns `drawCount` cards from the stock onto the waste, or, once the stock
 *  is empty, turns the whole waste back over into a new stock (unlimited
 *  redeals). Returns `state` unchanged when both are empty. */
export function draw(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  if (state.stock.length === 0) {
    if (state.waste.length === 0) return state;
    return { ...state, stock: [...state.waste].reverse(), waste: [], moves: state.moves + 1 };
  }
  const turned = state.stock.slice(-state.drawCount).reverse();
  return {
    ...state,
    stock: state.stock.slice(0, state.stock.length - turned.length),
    waste: [...state.waste, ...turned],
    moves: state.moves + 1,
  };
}

/** The cards a tap on `pile` would pick up: the waste/foundation top card,
 *  or a column's face-up run from the tapped card to the top. */
export function movableCards(state: GameState, pile: PileRef): Card[] {
  if (pile.kind === "waste") return state.waste.slice(-1);
  if (pile.kind === "foundation") return state.foundations[pile.suit].slice(-1);
  const column = state.tableau[pile.col] ?? [];
  const index = pile.index ?? column.length - 1;
  if (index < 0 || !column[index]?.faceUp) return [];
  return column.slice(index).map((entry) => entry.card);
}

function canPlace(state: GameState, cards: Card[], target: Target): boolean {
  const [first] = cards;
  if (!first) return false;
  if (target.kind === "foundation") {
    const pile = state.foundations[target.suit];
    return cards.length === 1 && first.suit === target.suit && rankValue(first.rank) === pile.length + 1;
  }
  const top = state.tableau[target.col]?.at(-1);
  if (!top) return first.rank === "K";
  return top.faceUp && isRed(top.card.suit) !== isRed(first.suit) && rankValue(top.card.rank) === rankValue(first.rank) + 1;
}

/** Whether `pile` (a tap) and `target` designate the same pile. */
export function isSamePile(pile: PileRef | Target, target: Target): boolean {
  if (pile.kind === "foundation" && target.kind === "foundation") return pile.suit === target.suit;
  if (pile.kind === "tableau" && target.kind === "tableau") return pile.col === target.col;
  return false;
}

/** Every legal destination for what a tap on `pile` picks up, foundation first. */
export function legalTargets(state: GameState, pile: PileRef): Target[] {
  if (state.phase !== "playing") return [];
  const cards = movableCards(state, pile);
  const candidates: Target[] = [
    ...SUITS.map((suit) => ({ kind: "foundation", suit }) as Target),
    ...state.tableau.map((_, col) => ({ kind: "tableau", col }) as Target),
  ];
  return candidates.filter((target) => !isSamePile(pile, target) && canPlace(state, cards, target));
}

function withTopFaceUp(column: TableauCard[]): TableauCard[] {
  const top = column.at(-1);
  if (!top || top.faceUp) return column;
  return [...column.slice(0, -1), { ...top, faceUp: true }];
}

function removeFrom(state: GameState, pile: PileRef, count: number): GameState {
  if (pile.kind === "waste") return { ...state, waste: state.waste.slice(0, -count) };
  if (pile.kind === "foundation") {
    return { ...state, foundations: { ...state.foundations, [pile.suit]: state.foundations[pile.suit].slice(0, -count) } };
  }
  const tableau = state.tableau.map((column, col) => (col === pile.col ? withTopFaceUp(column.slice(0, -count)) : column));
  return { ...state, tableau };
}

function addTo(state: GameState, target: Target, cards: Card[]): GameState {
  if (target.kind === "foundation") {
    return { ...state, foundations: { ...state.foundations, [target.suit]: [...state.foundations[target.suit], ...cards] } };
  }
  const added = cards.map((card) => ({ card, faceUp: true }));
  const tableau = state.tableau.map((column, col) => (col === target.col ? [...column, ...added] : column));
  return { ...state, tableau };
}

export function isWon(state: GameState): boolean {
  return SUITS.every((suit) => state.foundations[suit].length === FULL_SUIT);
}

/** Moves what a tap on `pile` picks up onto `target`, flipping the column
 *  card it uncovers. Returns null for an illegal move. */
export function applyMove(state: GameState, pile: PileRef, target: Target): GameState | null {
  if (!legalTargets(state, pile).some((legal) => isSamePile(legal, target))) return null;
  const cards = movableCards(state, pile);
  const next = addTo(removeFrom(state, pile, cards.length), target, cards);
  const moved = { ...next, moves: state.moves + 1 };
  return isWon(moved) ? { ...moved, phase: "finished" } : moved;
}
