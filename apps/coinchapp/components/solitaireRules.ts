/** Solitaire's entry in `RulesModal` (same shape as the other games' rules). */
export const SOLITAIRE_RULES = {
  fr: {
    title: "Règles du Solitaire",
    sections: [
      {
        heading: "But du jeu",
        body: "Ranger les 52 cartes sur les 4 fondations (en haut à droite), une par couleur, de l'As au Roi.",
      },
      {
        heading: "Les colonnes",
        body: "7 colonnes, dont seule la carte du dessus est retournée. On y empile en descendant et en alternant rouge et noir (un 6 noir sur un 7 rouge). On peut déplacer une suite entière. Seul un Roi peut aller dans une colonne vide. La carte découverte se retourne toute seule.",
      },
      {
        heading: "La pioche",
        body: "Touchez la pioche pour retourner 1 ou 3 cartes (selon le mode choisi) sur la défausse. Seule la carte du dessus de la défausse se joue. Pioche vide : touchez-la pour retourner la défausse, autant de fois que vous voulez.",
      },
      {
        heading: "Jouer une carte",
        body: "Touchez une carte : si elle n'a qu'une place possible, elle y va directement. Si elle en a plusieurs, elle s'allume avec ses destinations : touchez celle que vous voulez. Touchez-la à nouveau pour la reposer.",
      },
      {
        heading: "Terminer",
        body: "Quand la pioche et la défausse sont vides et que toutes les cartes des colonnes sont retournées, la partie est gagnée d'avance : touchez « Terminer » et les cartes montent toutes seules sur les fondations.",
      },
    ],
  },
  en: {
    title: "Solitaire Rules",
    sections: [
      {
        heading: "Goal",
        body: "Move all 52 cards onto the 4 foundations (top right), one per suit, from Ace up to King.",
      },
      {
        heading: "Columns",
        body: "7 columns, only the top card face up. Build them down in alternating colours (a black 6 on a red 7). A whole run can move at once. Only a King may go into an empty column. An uncovered card turns over by itself.",
      },
      {
        heading: "Stock",
        body: "Tap the stock to turn 1 or 3 cards (depending on the mode) onto the waste. Only the waste's top card can be played. Empty stock: tap it to turn the waste back over, as often as you like.",
      },
      {
        heading: "Playing a card",
        body: "Tap a card: if it has only one place to go, it goes there. If it has several, it lights up with its destinations: tap the one you want. Tap it again to put it back down.",
      },
      {
        heading: "Finish",
        body: "Once the stock and waste are empty and every column card is face up, the game is won: tap \"Finish\" and the cards climb onto the foundations by themselves.",
      },
    ],
  },
} as const;
