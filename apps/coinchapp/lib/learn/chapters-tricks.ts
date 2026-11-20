import type { Chapter } from "./types";

/** Every "trick" step: you are seat 0 and play last (seats 1, 2, 3 already played). */
export const TRICKS: Chapter = {
  id: "tricks",
  title: { fr: "Jouer un pli", en: "Playing a trick" },
  summary: { fr: "Fournir, couper, monter : 4 cas à jouer.", en: "Follow, trump, overtrump: 4 cases to play." },
  minutes: 2,
  steps: [
    {
      kind: "info",
      id: "tricks-rules",
      title: { fr: "Les 3 règles du pli", en: "The 3 trick rules" },
      body: {
        fr: "1. Fournissez la couleur demandée si vous l'avez.\n2. Sinon, coupez avec un atout, sauf si votre partenaire est déjà maître du pli.\n3. Quand on joue atout, il faut monter (jouer plus fort) si on le peut.\nLe pli va à la plus forte carte de la couleur demandée, ou au plus fort atout.",
        en: "1. Follow the led suit if you can.\n2. Otherwise trump, unless your partner is already winning the trick.\n3. When trumps are played, you must go higher if you can.\nThe trick goes to the highest card of the led suit, or the highest trump.",
      },
    },
    {
      kind: "quiz",
      id: "tricks-winner",
      title: { fr: "Qui gagne ce pli ?", en: "Who wins this trick?" },
      question: {
        fr: "L'atout est ♦. On a joué : As ♠, 10 ♠, 7 ♦, Roi ♠.",
        en: "Trump is diamonds. Played: Ace ♠, 10 ♠, 7 ♦, King ♠.",
      },
      options: [{ card: "AS" }, { card: "7D" }, { card: "KS" }],
      answer: 1,
      explain: {
        fr: "Le plus petit atout bat n'importe quelle carte d'une autre couleur.",
        en: "The smallest trump beats any card of another suit.",
      },
    },
    {
      kind: "trick",
      id: "tricks-follow",
      title: { fr: "Cas 1 : fournir", en: "Case 1: follow suit" },
      prompt: { fr: "Atout ♥. On joue ♠. Remportez le pli !", en: "Trump is hearts. Spades were led. Win the trick!" },
      trump: "H",
      hand: "10S 8S JD AD 9C KH 7H QC",
      played: "QS 7S KS",
      best: "10S",
      explain: {
        fr: "Vous devez jouer ♠. Le 10 ♠ bat le Roi ♠ et rapporte 10 points. Le 8 ♠ perdait le pli.",
        en: "You must play a spade. The 10 ♠ beats the King ♠ and scores 10 points. The 8 ♠ would lose.",
      },
    },
    {
      kind: "trick",
      id: "tricks-cut",
      title: { fr: "Cas 2 : couper", en: "Case 2: trump in" },
      prompt: {
        fr: "Atout ♥. On joue ♦ et vous n'en avez pas. L'adversaire est maître avec l'As.",
        en: "Trump is hearts. Diamonds were led and you have none. An opponent is winning with the Ace.",
      },
      trump: "H",
      hand: "JH 7H AS KS QS 9C 8C 10C",
      played: "AD 8D 10D",
      best: "7H",
      explain: {
        fr: "Vous êtes obligé de couper. Un petit atout suffit : le 7 ♥ ramasse l'As et le 10 ♦ (21 points). Gardez le Valet pour plus tard !",
        en: "You must trump. A small one is enough: the 7 ♥ takes the Ace and the 10 ♦ (21 points). Keep the Jack for later!",
      },
    },
    {
      kind: "trick",
      id: "tricks-partner",
      title: { fr: "Cas 3 : partenaire maître", en: "Case 3: partner winning" },
      prompt: {
        fr: "Atout ♠. On joue ♥, vous n'en avez pas. Votre partenaire est maître avec l'As ♥.",
        en: "Trump is spades. Hearts were led, you have none. Your partner wins with the Ace ♥.",
      },
      trump: "S",
      hand: "9S 8S AD 10D KC QC 7C 8D",
      played: "7H AH 8H",
      best: "10D",
      explain: {
        fr: "Pas besoin de couper : le pli est déjà à vous. Donnez des points à votre partenaire avec le 10 ♦ et gardez l'As ♦, qui gagnera un pli plus tard.",
        en: "No need to trump: the trick is already yours. Give your partner points with the 10 ♦ and keep the Ace ♦, it will win a trick later.",
      },
    },
    {
      kind: "trick",
      id: "tricks-overtrump",
      title: { fr: "Cas 4 : monter à l'atout", en: "Case 4: overtrump" },
      prompt: {
        fr: "Atout ♥. Un adversaire a joué l'As ♥. Quelle carte devez-vous jouer ?",
        en: "Trump is hearts. An opponent played the Ace ♥. Which card must you play?",
      },
      trump: "H",
      hand: "JH 9H 8H 10S KS 9D 7C AC",
      played: "QH 7H AH",
      best: "JH 9H",
      explain: {
        fr: "On joue atout et vous pouvez monter : c'est obligatoire. Le 8 ♥ est interdit. Le Valet ou le 9 ♥ battent l'As et ramassent le pli.",
        en: "Trumps were played and you can go higher: you must. The 8 ♥ is not allowed. The Jack or the 9 ♥ beat the Ace and take the trick.",
      },
    },
  ],
};
