/** Belote's entry in `RulesModal` (same shape as the other games' rules). */
export const BELOTE_RULES = {
  fr: {
    title: "Règles de la Belote",
    sections: [
      {
        heading: "But du jeu",
        body: "4 joueurs en 2 équipes de 2, partenaires face à face. Jeu de 32 cartes. La première équipe à atteindre le score objectif gagne.",
      },
      {
        heading: "La donne",
        body: "Chaque joueur reçoit 5 cartes, puis une carte est retournée au milieu de la table.",
      },
      {
        heading: "Prendre ou passer",
        body: "1er tour : chacun peut prendre la couleur de la carte retournée comme atout, ou passer.\n2e tour (si tout le monde a passé) : chacun peut nommer une autre couleur, ou passer.\nSi personne ne prend, on redistribue. Le preneur reçoit la carte retournée et 2 cartes, les autres 3 : tout le monde a 8 cartes.",
      },
      {
        heading: "Ordre des cartes",
        body: "À l'atout : Valet (20 pts) › 9 (14 pts) › As (11 pts) › 10 (10 pts) › Roi (4 pts) › Dame (3 pts) › 8 › 7.\nAutres couleurs : As (11 pts) › 10 (10 pts) › Roi (4 pts) › Dame (3 pts) › Valet (2 pts) › 9 › 8 › 7.",
      },
      {
        heading: "Le jeu des plis",
        body: "Fournissez la couleur demandée. Si impossible, coupez à l'atout (en montant si possible), sauf si votre partenaire est maître du pli. À l'atout, il faut toujours monter si on peut.",
      },
      {
        heading: "Belote et rebelote",
        body: "Le Roi et la Dame d'atout dans la même main valent 20 points, annoncés automatiquement quand ils sont joués.",
      },
      {
        heading: "Le comptage",
        body: "152 pts dans les plis + 10 de der = 162. Le preneur doit faire au moins autant de points que la défense (belote comprise) : chaque équipe marque alors ses points. Sinon il est « dedans » : la défense marque 162. Capot (tous les plis) : 252 points.",
      },
    ],
  },
  en: {
    title: "Belote Rules",
    sections: [
      {
        heading: "Goal",
        body: "4 players in 2 teams of 2, partners facing each other. 32-card pack. First team to reach the target score wins.",
      },
      {
        heading: "The deal",
        body: "Each player gets 5 cards, then one card is turned face up in the middle of the table.",
      },
      {
        heading: "Take or pass",
        body: "1st round: each player may take the turned card's suit as trump, or pass.\n2nd round (if everyone passed): each player may name another suit, or pass.\nIf nobody takes, the cards are redealt. The taker gets the turned card plus 2 cards, the others 3: everyone holds 8.",
      },
      {
        heading: "Card order",
        body: "Trump: Jack (20 pts) › 9 (14 pts) › Ace (11 pts) › 10 (10 pts) › King (4 pts) › Queen (3 pts) › 8 › 7.\nOther suits: Ace (11 pts) › 10 (10 pts) › King (4 pts) › Queen (3 pts) › Jack (2 pts) › 9 › 8 › 7.",
      },
      {
        heading: "Playing tricks",
        body: "Follow the led suit. If you can't, trump (overtrumping if you can) unless your partner is winning the trick. In trump, always beat the highest trump if you can.",
      },
      {
        heading: "Belote and rebelote",
        body: "King and Queen of trump in the same hand are worth 20 points, announced automatically when played.",
      },
      {
        heading: "Scoring",
        body: "152 trick points + 10 for the last trick = 162. The taker must score at least as much as the defence (belote included): each team then scores its own points. Otherwise the taker is \"dedans\": the defence scores 162. Capot (every trick): 252 points.",
      },
    ],
  },
} as const;
