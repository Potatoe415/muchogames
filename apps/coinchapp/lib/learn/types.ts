import type { Locale } from "@/lib/client/i18n";
import type { Seat, Suit } from "@/lib/coinche";

/** Tutorial copy, one string per app locale. */
export type Text = { fr: string; en: string };

export function tr(text: Text, locale: Locale): string {
  return text[locale];
}

/** Cards are written "JH 9H 10S" (see `parseCards` in `./engine`). */
export type CardList = string;

export type QuizOption = { text?: Text; card?: string };

export type Step =
  | {
      kind: "info";
      id: string;
      title: Text;
      body: Text;
      /** Cards dealt in with an animation; tap one for its tooltip. */
      cards?: CardList;
      /** Trump for the cards' tooltips (points and strength). */
      trump?: Suit;
      /** Extra picture: the 4 seats and teams, or a "Belote !" flash. */
      illustration?: "table" | "belote";
      tip?: Text;
    }
  | {
      kind: "quiz";
      id: string;
      title: Text;
      question: Text;
      /** Optional hand shown above the question. */
      hand?: CardList;
      /** Optional auction so far, one line per bid. */
      auction?: Text[];
      options: QuizOption[];
      answer: number;
      explain: Text;
    }
  | {
      kind: "trick";
      id: string;
      title: Text;
      prompt: Text;
      trump: Suit;
      /** Your 8 (or fewer) cards; you sit at seat 0. */
      hand: CardList;
      /** Cards already on the felt, in play order, ending with seat 3. */
      played: CardList;
      /** Legal cards that count as the right answer. */
      best: CardList;
      explain: Text;
    }
  | {
      kind: "deal";
      id: string;
      title: Text;
      intro: Text;
      trump: Suit;
      /** Contract taker and value. */
      taker: Seat;
      value: number;
      /** 2 when the defense coinched. */
      coinche?: 1 | 2;
      leader: Seat;
      /** hands[seat]: the full 32-card deal. */
      hands: [CardList, CardList, CardList, CardList];
    };

export type Chapter = {
  id: string;
  title: Text;
  summary: Text;
  minutes: number;
  steps: Step[];
};
