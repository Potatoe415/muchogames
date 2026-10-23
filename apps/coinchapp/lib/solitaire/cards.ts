import { buildDeck as buildDeckGeneric, type Suit } from "@/lib/cards";
import type { Card, Rank } from "./types";

export { shuffle } from "@/lib/cards";

/** Ace low, King high: foundations build up this order, columns build down it. */
export const RANK_ORDER: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function buildDeck(): Card[] {
  return buildDeckGeneric(RANK_ORDER);
}

export function rankValue(rank: Rank): number {
  return RANK_ORDER.indexOf(rank) + 1;
}

export function isRed(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}
