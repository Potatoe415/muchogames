// Pure deck rules -> window.CafardsDeck: the official 128-card deck (28
// vegetables + 4 taboo cards of each kind), a balanced deck for other sizes,
// the deal, and a random pose for a card laid on a pile.
(function () {
  const VEG = ["tomate", "salade", "poivron", "chou-fleur"];
  const OFFICIAL_SIZE = 128;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function createExactDeck() {
    const cards = [];
    VEG.forEach((veg) => {
      for (let i = 0; i < 28; i++) cards.push({ type: "legume", veg });
      for (let i = 0; i < 4; i++) cards.push({ type: "tabou", veg });
    });
    return shuffle(cards);
  }

  // About one taboo card in eight, spread evenly over the four vegetables.
  function createBalancedDeck(total) {
    const cards = [];
    const tabooTotal = Math.max(VEG.length, Math.round(total / 8));
    VEG.forEach((veg, index) => {
      const count = Math.floor(tabooTotal / VEG.length) + (index < tabooTotal % VEG.length ? 1 : 0);
      for (let i = 0; i < count; i++) cards.push({ type: "tabou", veg });
    });
    const perVeg = Math.floor(Math.max(0, total - cards.length) / VEG.length);
    VEG.forEach((veg) => {
      for (let i = 0; i < perVeg; i++) cards.push({ type: "legume", veg });
    });
    while (cards.length < total) {
      cards.push({ type: "legume", veg: VEG[cards.length % VEG.length] });
    }
    return shuffle(cards);
  }

  const createDeck = (total) => (total === OFFICIAL_SIZE ? createExactDeck() : createBalancedDeck(total));

  // Same size rule as save.js `consistent`: a multiple of the player count.
  function deal(config) {
    const count = config.count;
    const total = Math.max(count, config.deckSize - (config.deckSize % count));
    const players = Array.from({ length: count }, () => ({ hand: [], losses: 0 }));
    createDeck(total).forEach((card, i) => players[i % count].hand.push(card));
    return players;
  }

  // left/top: small offsets in px from the pile's centre (older saves kept
  // larger values; the board clamps them), angle in degrees.
  function makePose(index, pileIndex) {
    const spread = Math.min(index, 12);
    const direction = index % 2 === 0 ? 1 : -1;
    return {
      left: 24 + spread * 2 + Math.random() * 7,
      top: 24 + spread * 3 + Math.random() * 8,
      angle: direction * (7 + Math.random() * 7) + (pileIndex ? 1.5 : -1.5)
    };
  }

  window.CafardsDeck = { shuffle, deal, makePose };
})();
