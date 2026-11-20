import type { Chapter } from "./types";

export const BASICS: Chapter = {
  id: "basics",
  title: { fr: "Les bases", en: "The basics" },
  summary: { fr: "Équipes, cartes et déroulement d'une donne.", en: "Teams, cards and how a deal goes." },
  minutes: 1,
  steps: [
    {
      kind: "info",
      id: "basics-table",
      title: { fr: "4 joueurs, 2 équipes", en: "4 players, 2 teams" },
      body: {
        fr: "On joue à 4, en deux équipes de 2. Votre partenaire est assis en face de vous, les adversaires à votre gauche et à votre droite.",
        en: "Four players in two teams of two. Your partner sits across from you, the opponents to your left and right.",
      },
      illustration: "table",
    },
    {
      kind: "info",
      id: "basics-deck",
      title: { fr: "32 cartes, 8 chacun", en: "32 cards, 8 each" },
      body: {
        fr: "On utilise les cartes du 7 à l'As, dans les 4 couleurs. Chaque joueur reçoit 8 cartes. Touchez une carte pour voir combien de points elle vaut.",
        en: "Cards run from 7 to Ace in all 4 suits. Every player gets 8 cards. Tap a card to see how many points it is worth.",
      },
      cards: "AS 10H KD QC JS 9H 8D 7C",
      tip: {
        fr: "Une donne se joue en 3 temps : les annonces, puis 8 plis, puis on compte les points.",
        en: "A deal has 3 parts: the bidding, then 8 tricks, then the scoring.",
      },
    },
    {
      kind: "quiz",
      id: "basics-partner",
      title: { fr: "Petit test", en: "Quick check" },
      question: { fr: "Qui est votre partenaire ?", en: "Who is your partner?" },
      options: [
        { text: { fr: "Le joueur à ma gauche", en: "The player on my left" } },
        { text: { fr: "Le joueur en face de moi", en: "The player across from me" } },
        { text: { fr: "Le joueur à ma droite", en: "The player on my right" } },
      ],
      answer: 1,
      explain: {
        fr: "Votre partenaire est toujours en face. Les plis qu'il gagne comptent pour votre équipe.",
        en: "Your partner always sits across. Every trick they win counts for your team.",
      },
    },
  ],
};

export const CARDS: Chapter = {
  id: "cards",
  title: { fr: "La force des cartes", en: "Card strength" },
  summary: { fr: "L'atout change tout : ordre et points.", en: "Trump changes everything: order and points." },
  minutes: 1,
  steps: [
    {
      kind: "info",
      id: "cards-trump",
      title: { fr: "À l'atout", en: "In the trump suit" },
      body: {
        fr: "Une couleur est choisie comme atout pendant les annonces. Ses cartes battent toutes les autres. Attention, l'ordre change : le Valet est le plus fort, puis le 9 !",
        en: "One suit becomes trump during the bidding. Its cards beat every other suit. Careful, the order changes: the Jack is highest, then the 9!",
      },
      cards: "JH 9H AH 10H KH QH 8H 7H",
      trump: "H",
      tip: {
        fr: "Valet 20, 9 14, As 11, 10 10, Roi 4, Dame 3, 8 et 7 : 0.",
        en: "Jack 20, 9 14, Ace 11, 10 10, King 4, Queen 3, 8 and 7: 0.",
      },
    },
    {
      kind: "info",
      id: "cards-plain",
      title: { fr: "Dans les autres couleurs", en: "In the other suits" },
      body: {
        fr: "Hors atout, c'est l'ordre habituel, sauf le 10 qui passe juste après l'As. Ici l'atout est ♥, donc les ♠ sont une couleur normale.",
        en: "Outside trump the order is the usual one, except the 10 ranks right after the Ace. Trump is ♥ here, so spades are a plain suit.",
      },
      cards: "AS 10S KS QS JS 9S 8S 7S",
      trump: "H",
      tip: {
        fr: "As 11, 10 10, Roi 4, Dame 3, Valet 2, 9, 8 et 7 : 0.",
        en: "Ace 11, 10 10, King 4, Queen 3, Jack 2, 9, 8 and 7: 0.",
      },
    },
    {
      kind: "quiz",
      id: "cards-strongest",
      title: { fr: "Quelle carte est la plus forte ?", en: "Which card is strongest?" },
      question: { fr: "L'atout est ♥.", en: "Trump is hearts." },
      options: [{ card: "AH" }, { card: "JH" }, { card: "10H" }],
      answer: 1,
      explain: {
        fr: "À l'atout, le Valet bat tout le monde, même l'As.",
        en: "In trump, the Jack beats everything, even the Ace.",
      },
    },
    {
      kind: "quiz",
      id: "cards-points",
      title: { fr: "Quelle carte rapporte le plus ?", en: "Which card scores most?" },
      question: { fr: "L'atout est ♣.", en: "Trump is clubs." },
      options: [{ card: "AC" }, { card: "9C" }, { card: "10C" }],
      answer: 1,
      explain: {
        fr: "Le 9 d'atout vaut 14 points, plus que l'As (11) et le 10 (10).",
        en: "The trump 9 is worth 14 points, more than the Ace (11) and the 10 (10).",
      },
    },
    {
      kind: "info",
      id: "cards-belote",
      title: { fr: "La Belote", en: "Belote" },
      body: {
        fr: "Le Roi et la Dame d'atout dans la même main font la Belote : 20 points bonus. On dit « Belote » en jouant la première, « Rebelote » avec la seconde.",
        en: "King and Queen of trump in the same hand make a Belote: 20 bonus points. Say \"Belote\" with the first one and \"Rebelote\" with the second.",
      },
      cards: "KH QH",
      trump: "H",
      illustration: "belote",
    },
  ],
};
