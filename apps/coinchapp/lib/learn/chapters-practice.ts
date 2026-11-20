import { BASICS, CARDS } from "./chapters-basics";
import { BIDDING, SCORING } from "./chapters-bidding";
import { TRICKS } from "./chapters-tricks";
import type { Chapter } from "./types";

/** Three full scripted deals: you play seat 0, the bots play the other seats. */
export const PRACTICE: Chapter = {
  id: "practice",
  title: { fr: "Donnes guidées", en: "Guided deals" },
  summary: { fr: "3 donnes complètes avec un coach.", en: "3 full deals with a coach." },
  minutes: 3,
  steps: [
    {
      kind: "deal",
      id: "practice-attack",
      title: { fr: "Donne 1 : vous attaquez", en: "Deal 1: you attack" },
      intro: {
        fr: "Vous avez pris 80 ♥ avec une très belle main. Conseil : jouez vos gros atouts d'abord pour faire tomber ceux des adversaires, puis vos As.",
        en: "You took 80 ♥ with a great hand. Tip: play your big trumps first to pull the opponents' trumps, then your Aces.",
      },
      trump: "H",
      taker: 0,
      value: 80,
      leader: 0,
      hands: [
        "JH 9H AH 10H AS 10S AC 7D",
        "QH 8H KS 9S AD 9D 8C 7C",
        "KH JS QS 10D KD 10C KC QC",
        "7H 8S 7S JD QD 8D 9C JC",
      ],
    },
    {
      kind: "deal",
      id: "practice-belote",
      title: { fr: "Donne 2 : la Belote", en: "Deal 2: the Belote" },
      intro: {
        fr: "Vous avez pris 100 ♠ avec le Valet, le Roi et la Dame d'atout : la Belote vous donne 20 points. L'adversaire de droite commence.",
        en: "You took 100 ♠ with the Jack, King and Queen of trump: the Belote gives you 20 points. The right opponent leads.",
      },
      trump: "S",
      taker: 0,
      value: 100,
      leader: 1,
      hands: [
        "JS KS QS 7S AH 10H AD 8C",
        "8S AC 10C QH 9H KD QD 7C",
        "9S AS KH 8H 10D JD 9C QC",
        "10S JH 7H 9D 8D 7D KC JC",
      ],
    },
    {
      kind: "deal",
      id: "practice-defense",
      title: { fr: "Donne 3 : en défense", en: "Deal 3: on defense" },
      intro: {
        fr: "L'adversaire de gauche a pris 100 ♣ et vous avez coinché : vous tenez le Valet et le 9 d'atout. Faites-le chuter !",
        en: "The left opponent took 100 ♣ and you coinched: you hold the trump Jack and 9. Make them fail!",
      },
      trump: "C",
      taker: 3,
      value: 100,
      coinche: 2,
      leader: 0,
      hands: [
        "JC 9C AH 10H KH AD 10D 7S",
        "7C JS QS 9S 8S 7D 8D 9D",
        "QH JH 9H 8H 7H KD QD JD",
        "AC 10C KC QC 8C AS 10S KS",
      ],
    },
  ],
};

export const CHAPTERS: Chapter[] = [BASICS, CARDS, TRICKS, BIDDING, SCORING, PRACTICE];
