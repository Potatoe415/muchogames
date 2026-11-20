import type { Chapter } from "./types";

export const BIDDING: Chapter = {
  id: "bidding",
  title: { fr: "Les annonces", en: "Bidding" },
  summary: { fr: "Annoncer, monter, passer et coincher.", en: "Bid, raise, pass and coinche." },
  minutes: 2,
  steps: [
    {
      kind: "info",
      id: "bidding-how",
      title: { fr: "Comment on annonce", en: "How bidding works" },
      body: {
        fr: "Chacun son tour, on annonce un nombre de points (80, 90, 100… jusqu'à 160) et une couleur d'atout, ou on passe. Chaque annonce doit être plus haute que la précédente. Quand 3 joueurs passent après une annonce, elle devient le contrat.",
        en: "In turn, each player bids a number of points (80, 90, 100… up to 160) and a trump suit, or passes. Every bid must be higher than the last one. When 3 players pass after a bid, it becomes the contract.",
      },
      tip: {
        fr: "Capot (250) : vous promettez de faire les 8 plis. À garder pour les mains énormes !",
        en: "Capot (250): you promise to win all 8 tricks. Keep it for huge hands!",
      },
    },
    {
      kind: "info",
      id: "bidding-eval",
      title: { fr: "Évaluer sa main", en: "Judging your hand" },
      body: {
        fr: "Repère simple pour débuter : avec le Valet, le 9 et un autre atout, annoncez 80. Ajoutez 10 par As dans une autre couleur. Sans Valet ni 9 d'atout, passez le plus souvent.",
        en: "Simple starting rule: with the Jack, the 9 and another trump, bid 80. Add 10 for each Ace in another suit. Without the trump Jack or 9, pass most of the time.",
      },
      cards: "JH 9H 7H AS AC",
      trump: "H",
      tip: {
        fr: "Ici : Valet + 9 + 7 d'atout = 80, plus deux As = 100 ♥.",
        en: "Here: Jack + 9 + 7 of trump = 80, plus two Aces = 100 ♥.",
      },
    },
    {
      kind: "quiz",
      id: "bidding-open",
      title: { fr: "Que dites-vous ?", en: "What do you bid?" },
      question: { fr: "Vous parlez en premier.", en: "You bid first." },
      hand: "JH 9H AH 7H AS KD 8C 7C",
      options: [{ text: { fr: "Passe", en: "Pass" } }, { text: { fr: "90 ♥", en: "90 ♥" } }, { text: { fr: "Capot ♥", en: "Capot ♥" } }],
      answer: 1,
      explain: {
        fr: "Valet, 9, As et 7 de ♥ plus l'As ♠ : une belle main pour 90 ou 100. Capot serait bien trop risqué.",
        en: "Jack, 9, Ace and 7 of hearts plus the Ace of spades: a nice hand for 90 or 100. Capot would be far too risky.",
      },
    },
    {
      kind: "quiz",
      id: "bidding-weak",
      title: { fr: "Et avec cette main ?", en: "And with this hand?" },
      question: { fr: "Vous parlez en premier.", en: "You bid first." },
      hand: "8S 7S QH 7H 9D 8D KC 10C",
      options: [{ text: { fr: "Passe", en: "Pass" } }, { text: { fr: "80 ♠", en: "80 ♠" } }, { text: { fr: "80 ♣", en: "80 ♣" } }],
      answer: 0,
      explain: {
        fr: "Aucun Valet, aucun 9 d'atout, aucun As : passez et laissez parler les autres.",
        en: "No Jack, no trump 9, no Ace: pass and let the others bid.",
      },
    },
    {
      kind: "quiz",
      id: "bidding-raise",
      title: { fr: "Aidez votre partenaire", en: "Support your partner" },
      question: { fr: "Votre partenaire a annoncé 80 ♠.", en: "Your partner bid 80 ♠." },
      hand: "9S 7S AH AD 10D KC 8C 7H",
      auction: [
        { fr: "Partenaire : 80 ♠", en: "Partner: 80 ♠" },
        { fr: "Adversaire gauche : passe", en: "Left opponent: pass" },
      ],
      options: [{ text: { fr: "Passe", en: "Pass" } }, { text: { fr: "100 ♠", en: "100 ♠" } }, { text: { fr: "80 ♥", en: "80 ♥" } }],
      answer: 1,
      explain: {
        fr: "Vous avez le 9 d'atout et deux As : montez de 10 par As, donc 100 ♠. 80 ♥ est impossible, il faut annoncer plus haut que 80.",
        en: "You hold the trump 9 and two Aces: raise 10 per Ace, so 100 ♠. 80 ♥ isn't allowed, you must bid higher than 80.",
      },
    },
    {
      kind: "info",
      id: "bidding-coinche",
      title: { fr: "Coincher", en: "Coinche" },
      body: {
        fr: "Si vous pensez que l'adversaire va rater son contrat, dites « Coinche » : les points sont doublés. L'équipe qui a annoncé peut répondre « Surcoinche » : ×4. La coinche arrête les annonces.",
        en: "If you think the opponents will miss their contract, say \"Coinche\": points are doubled. The bidding team may answer \"Surcoinche\": ×4. A coinche ends the bidding.",
      },
    },
    {
      kind: "quiz",
      id: "bidding-coinche-quiz",
      title: { fr: "Coincher ou pas ?", en: "Coinche or not?" },
      question: { fr: "L'adversaire de gauche a annoncé 120 ♣.", en: "The left opponent bid 120 ♣." },
      hand: "JC 9C AC AH 10H AD 7S 8S",
      auction: [{ fr: "Adversaire gauche : 120 ♣", en: "Left opponent: 120 ♣" }],
      options: [{ text: { fr: "Passe", en: "Pass" } }, { text: { fr: "Coinche", en: "Coinche" } }, { text: { fr: "130 ♣", en: "130 ♣" } }],
      answer: 1,
      explain: {
        fr: "Vous avez les trois plus gros atouts de l'adversaire et deux As : il ne fera jamais 120. Coinchez pour doubler sa chute !",
        en: "You hold their three biggest trumps and two Aces: they will never make 120. Coinche to double their loss!",
      },
    },
  ],
};

export const SCORING: Chapter = {
  id: "scoring",
  title: { fr: "Compter les points", en: "Scoring" },
  summary: { fr: "Contrat réussi, chute et coinche.", en: "Made contract, failed contract and coinche." },
  minutes: 1,
  steps: [
    {
      kind: "info",
      id: "scoring-total",
      title: { fr: "162 points par donne", en: "162 points per deal" },
      body: {
        fr: "Les cartes valent 152 points en tout. Le dernier pli rapporte 10 points de plus : le « 10 de der ». Total : 162. L'équipe qui a pris doit faire au moins la valeur de son contrat (la Belote compte).",
        en: "The cards are worth 152 points in total. The last trick earns 10 more: the \"10 de der\". Total: 162. The bidding team must score at least its contract value (Belote counts).",
      },
    },
    {
      kind: "info",
      id: "scoring-result",
      title: { fr: "Réussi ou chuté", en: "Made or failed" },
      body: {
        fr: "Contrat réussi : votre équipe marque la valeur annoncée (100 pour un 100), l'adversaire rien. Contrat chuté : l'adversaire marque 160. Coinché, tout est doublé. La première équipe à 1000 points gagne la partie.",
        en: "Contract made: your team scores the bid value (100 for a 100 bid), the opponents nothing. Contract failed: the opponents score 160. Coinched, everything is doubled. First team to 1000 points wins the match.",
      },
      tip: {
        fr: "Ce sont les règles par défaut. Vous pouvez les changer avant une partie en local.",
        en: "These are the default rules. You can change them before a local match.",
      },
    },
    {
      kind: "quiz",
      id: "scoring-made",
      title: { fr: "Combien marquez-vous ?", en: "How much do you score?" },
      question: {
        fr: "Votre contrat : 90 ♥. Vos plis valent 95 points.",
        en: "Your contract: 90 ♥. Your tricks are worth 95 points.",
      },
      options: [{ text: { fr: "90", en: "90" } }, { text: { fr: "95", en: "95" } }, { text: { fr: "0", en: "0" } }],
      answer: 0,
      explain: {
        fr: "95 ≥ 90 : réussi ! Vous marquez la valeur du contrat, 90.",
        en: "95 ≥ 90: made! You score the contract value, 90.",
      },
    },
    {
      kind: "quiz",
      id: "scoring-belote",
      title: { fr: "Réussi ou chuté ?", en: "Made or failed?" },
      question: {
        fr: "Contrat : 100 ♠. Vos plis : 82 points, et vous avez la Belote.",
        en: "Contract: 100 ♠. Your tricks: 82 points, and you have the Belote.",
      },
      options: [{ text: { fr: "Chuté", en: "Failed" } }, { text: { fr: "Réussi", en: "Made" } }],
      answer: 1,
      explain: {
        fr: "82 + 20 de Belote = 102 : le contrat de 100 est réussi.",
        en: "82 + 20 for the Belote = 102: the 100 contract is made.",
      },
    },
    {
      kind: "quiz",
      id: "scoring-coinche",
      title: { fr: "Aïe, la coinche !", en: "Ouch, the coinche!" },
      question: {
        fr: "Vous avez annoncé 110 ♦, l'adversaire a coinché et vous chutez. Combien marque l'adversaire ?",
        en: "You bid 110 ♦, the opponents coinched and you failed. How much do they score?",
      },
      options: [{ text: { fr: "160", en: "160" } }, { text: { fr: "220", en: "220" } }, { text: { fr: "320", en: "320" } }],
      answer: 2,
      explain: {
        fr: "Une chute vaut 160, doublée par la coinche : 320 pour l'adversaire.",
        en: "A failed contract is worth 160, doubled by the coinche: 320 for the opponents.",
      },
    },
  ],
};
