import type { Locale } from "@/lib/client/i18n";

const FR = {
  draw1: "Pioche 1 carte",
  draw1Note: "La version la plus facile",
  draw3: "Pioche 3 cartes",
  draw3Note: "Le classique, plus corsé",
  moves: "Coups",
  draw: "Piocher",
  redeal: "Retourner la défausse",
  foundation: "Fondation",
  emptyColumn: "Colonne vide",
  won: "Bravo, réussi !",
  wonMoves: "en {moves} coups",
  skipHint: "Touchez l'écran pour passer",
  autoFinish: "Terminer",
};

/** Solitaire-only copy, kept out of the shared `i18n.tsx` dictionary. */
export const SOLITAIRE_LABELS: Record<Locale, typeof FR> = {
  fr: FR,
  en: {
    draw1: "Draw 1 card",
    draw1Note: "The easiest version",
    draw3: "Draw 3 cards",
    draw3Note: "The classic, harder",
    moves: "Moves",
    draw: "Draw",
    redeal: "Turn the waste over",
    foundation: "Foundation",
    emptyColumn: "Empty column",
    won: "Well done, solved!",
    wonMoves: "in {moves} moves",
    skipHint: "Tap the screen to skip",
    autoFinish: "Finish",
  },
};
