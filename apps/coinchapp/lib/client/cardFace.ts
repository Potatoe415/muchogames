import type { Locale } from "./i18n";

/** French decks print Valet, Dame, Roi. English keeps jack, queen, king. Ace stays A. */
const FRENCH_FACE: Record<string, string> = { J: "V", Q: "D", K: "R" };

export function faceRank(rank: string, locale: Locale): string {
  if (locale !== "fr") return rank;
  return FRENCH_FACE[rank] ?? rank;
}
