import type { CardOf, Suit } from "@/lib/cards";

export type { Suit } from "@/lib/cards";

export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Card = CardOf<Rank>;

/** Cards turned from the stock per tap (Klondike "draw 1" / "draw 3"). */
export type DrawCount = 1 | 3;

export interface TableauCard {
  card: Card;
  faceUp: boolean;
}

/** Where a tap lands. `tableau.index` is the tapped card's position in its
 *  column (0 = bottom of the column); omitted for a tap on the column itself. */
export type PileRef =
  | { kind: "waste" }
  | { kind: "foundation"; suit: Suit }
  | { kind: "tableau"; col: number; index?: number };

/** Where a move can land. A foundation's suit is implied by the moved card. */
export type Target = { kind: "foundation"; suit: Suit } | { kind: "tableau"; col: number };

export interface GameState {
  phase: "playing" | "finished";
  drawCount: DrawCount;
  /** Face down; the last element is the top card. */
  stock: Card[];
  /** Face up; the last element is the top (only playable) card. */
  waste: Card[];
  /** One pile per suit, Ace first. */
  foundations: Record<Suit, Card[]>;
  /** 7 columns; the last element is the column's top card. */
  tableau: TableauCard[][];
  moves: number;
}
