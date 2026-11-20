import type { Locale } from "@/lib/client/i18n";
import { cardPoints, type Card, type Rank, type Suit } from "@/lib/coinche";
import type { TurnRule } from "./engine";
import type { Text } from "./types";

const SUIT_SYMBOL: Record<Suit, string> = { H: "♥", D: "♦", C: "♣", S: "♠" };

const RANK_NAME: Record<Locale, Partial<Record<Rank, string>>> = {
  fr: { J: "Valet", Q: "Dame", K: "Roi", A: "As" },
  en: { J: "Jack", Q: "Queen", K: "King", A: "Ace" },
};

export function cardName(card: Card, locale: Locale): string {
  return `${RANK_NAME[locale][card.rank] ?? card.rank} ${SUIT_SYMBOL[card.suit]}`;
}

/** Tooltip for a tapped card: name, trump or not, points. */
export function cardTip(card: Card, trump: Suit | undefined, locale: Locale): string {
  const points = cardPoints(card, trump ?? null);
  const isTrump = trump !== undefined && card.suit === trump;
  if (locale === "fr") return `${cardName(card, locale)}${isTrump ? " (atout)" : ""} : ${points} point${points > 1 ? "s" : ""}`;
  return `${cardName(card, locale)}${isTrump ? " (trump)" : ""}: ${points} point${points === 1 ? "" : "s"}`;
}

/** Coach line for the player's turn, matching what `legalCards` allows. */
export const RULE_TEXT: Record<TurnRule, Text> = {
  lead: {
    fr: "À vous d'ouvrir le pli : jouez la carte de votre choix.",
    en: "You lead this trick: play any card you like.",
  },
  follow: {
    fr: "Vous avez la couleur demandée : vous devez la fournir.",
    en: "You hold the led suit: you must follow it.",
  },
  overtrump: {
    fr: "Atout demandé : vous devez monter (jouer un atout plus fort) dès que vous le pouvez.",
    en: "Trump was led: you must play a higher trump whenever you can.",
  },
  undertrump: {
    fr: "Atout demandé : vous ne pouvez pas monter, mais vous devez quand même jouer atout.",
    en: "Trump was led: you can't go higher, but you must still play a trump.",
  },
  "partner-master": {
    fr: "Votre partenaire est maître : pas obligé de couper. Jouez ce que vous voulez, donnez-lui des points !",
    en: "Your partner is winning: no need to trump. Play anything, give them points!",
  },
  "must-cut": {
    fr: "Vous n'avez pas la couleur et l'adversaire est maître : vous devez couper (jouer atout).",
    en: "You can't follow and an opponent is winning: you must trump.",
  },
  "must-undercut": {
    fr: "Vous devez couper, même avec un atout plus petit que celui déjà posé.",
    en: "You must trump, even with a lower trump than the one already played.",
  },
  "free-discard": {
    fr: "Ni la couleur, ni atout : défaussez votre carte la plus faible.",
    en: "Neither the suit nor a trump: throw away your weakest card.",
  },
};

export const SEAT_LABEL: Text[] = [
  { fr: "Vous", en: "You" },
  { fr: "Adversaire droite", en: "Right opponent" },
  { fr: "Partenaire", en: "Partner" },
  { fr: "Adversaire gauche", en: "Left opponent" },
];
