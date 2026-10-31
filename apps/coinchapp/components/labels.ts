import type { Bid, Contract, Suit, TrumpMode } from "@/lib/coinche";
import type { Locale } from "@/lib/client/i18n";
import { BELOTE_CONTRACT_VALUE, CAPOT_VALUE, GENERALE_VALUE } from "@/lib/coinche";

export const SUIT_SYMBOL: Record<Suit, string> = {
  H: "\u2665",
  D: "\u2666",
  C: "\u2663",
  S: "\u2660",
};

export function isRedSuit(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}

/** Short label/symbol for a trump mode (suit symbol, or TA/SA abbreviations). */
export function trumpModeLabel(mode: TrumpMode, locale: Locale = "fr"): string {
  if (mode === "TA") return locale === "fr" ? "TA" : "AT";
  if (mode === "SA") return "SA";
  return SUIT_SYMBOL[mode];
}

/** Label for a "bid" in history/bubbles. A belote take carries no value: "Prend ♥". */
export function formatBidLabel(bid: Bid, locale: Locale = "fr"): string {
  const suit = bid.suit ? ` ${trumpModeLabel(bid.suit, locale)}` : "";
  if (bid.value === undefined) return `${locale === "fr" ? "Prend" : "Takes"}${suit}`;
  const value = bid.value === CAPOT_VALUE ? "Capot" : bid.value === GENERALE_VALUE ? "Générale" : String(bid.value);
  return `${value}${suit}`;
}

export function formatContract(contract: Contract | null, locale: Locale = "fr"): string {
  if (!contract) return locale === "fr" ? "Pas de contrat" : "No contract";
  if (contract.value === BELOTE_CONTRACT_VALUE) {
    return `${locale === "fr" ? "Atout" : "Trump"} ${trumpModeLabel(contract.suit, locale)}`;
  }
  const value =
    contract.value === CAPOT_VALUE
      ? "Capot"
      : contract.value === GENERALE_VALUE
        ? locale === "fr"
          ? "Générale"
          : "General"
        : `${contract.value}`;
  const mult = contract.coinche === 4 ? " x4" : contract.coinche === 2 ? " x2" : "";
  return `${value} ${trumpModeLabel(contract.suit, locale)}${mult}`;
}
