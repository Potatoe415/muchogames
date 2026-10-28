// Cards are integers 0–51: suit = card / 13 (0 ♣, 1 ♦, 2 ♥, 3 ♠, the bidding
// order), rank = card % 13 (0 = two … 8 = ten, 9 J, 10 Q, 11 K, 12 A).
// Seats run clockwise: 0 North, 1 East, 2 South, 3 West. Side 0 = North-South.
export const CLUBS = 0;
export const DIAMONDS = 1;
export const HEARTS = 2;
export const SPADES = 3;
export const NT = 4;
export const NORTH = 0;
export const EAST = 1;
export const SOUTH = 2;
export const WEST = 3;
export const JACK = 9;
export const QUEEN = 10;
export const KING = 11;
export const ACE = 12;

export const suitOf = (card) => Math.floor(card / 13);
export const rankOf = (card) => card % 13;
export const cardOf = (suit, rank) => suit * 13 + rank;
export const nextSeat = (seat, step = 1) => (seat + step) % 4;
export const partnerOf = (seat) => (seat + 2) % 4;
export const sideOf = (seat) => seat % 2;
export const isMajor = (suit) => suit === HEARTS || suit === SPADES;
export const between = (value, low, high) => value >= low && value <= high;

// Alternating colours, trumps first when there are trumps.
const DISPLAY_ORDERS = {
  [SPADES]: [SPADES, HEARTS, CLUBS, DIAMONDS],
  [HEARTS]: [HEARTS, SPADES, DIAMONDS, CLUBS],
  [DIAMONDS]: [DIAMONDS, SPADES, HEARTS, CLUBS],
  [CLUBS]: [CLUBS, HEARTS, SPADES, DIAMONDS]
};

export const displayOrder = (trump) =>
  DISPLAY_ORDERS[trump] || DISPLAY_ORDERS[SPADES];

export function sortForDisplay(cards, trump) {
  const order = displayOrder(trump);
  return [...cards].sort(
    (a, b) =>
      order.indexOf(suitOf(a)) - order.indexOf(suitOf(b)) ||
      rankOf(b) - rankOf(a)
  );
}

function randomInt(limit) {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] % limit;
  }
  return Math.floor(Math.random() * limit);
}

export function shuffle(items, random = randomInt) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = random(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function dealHands(random) {
  const deck = shuffle(
    Array.from({ length: 52 }, (_, card) => card),
    random
  );
  return [0, 1, 2, 3].map((seat) =>
    deck.slice(seat * 13, seat * 13 + 13).sort((a, b) => b - a)
  );
}

export const hcpOfCard = (card) => Math.max(0, rankOf(card) - 8);
export const hcpOf = (cards) =>
  cards.reduce((sum, card) => sum + hcpOfCard(card), 0);

export function suitLengths(cards) {
  const lengths = [0, 0, 0, 0];
  cards.forEach((card) => (lengths[suitOf(card)] += 1));
  return lengths;
}

export const cardsOfSuit = (cards, suit) =>
  cards.filter((card) => suitOf(card) === suit).sort((a, b) => b - a);

function hasStopper(cards, suit) {
  const ranks = cardsOfSuit(cards, suit).map(rankOf);
  const has = (rank) => ranks.includes(rank);
  const length = ranks.length;
  return (
    has(ACE) ||
    (has(KING) && length >= 2) ||
    (has(QUEEN) && length >= 3) ||
    (has(JACK) && length >= 4)
  );
}

// Honours (A K Q J 10) held in a suit: a rough suit quality.
const suitQuality = (cards, suit) =>
  cardsOfSuit(cards, suit).filter((card) => rankOf(card) >= 8).length;

const SHORT_POINTS = [3, 2, 1];

// Everything the bidding rules read about one hand.
export function evaluateHand(cards) {
  const len = suitLengths(cards);
  const hcp = hcpOf(cards);
  const sorted = [...len].sort((a, b) => b - a);
  const has = (suit, rank) => cards.includes(cardOf(suit, rank));
  const shortness = (trump, table) =>
    len.reduce(
      (sum, length, suit) =>
        suit === trump ? sum : sum + (table[length] || 0),
      0
    );
  const pts =
    hcp + len.reduce((sum, length) => sum + Math.max(0, length - 4), 0);
  return {
    cards,
    hcp,
    len,
    pts,
    balanced: sorted[0] <= 5 && sorted[2] >= 3 && sorted[3] >= 2,
    rule20: hcp + sorted[0] + sorted[1] >= 20,
    stop: [0, 1, 2, 3].map((suit) => hasStopper(cards, suit)),
    q: [0, 1, 2, 3].map((suit) => suitQuality(cards, suit)),
    has,
    // Dummy points: honours + shortness once a trump fit is found.
    dummy: (trump) => hcp + shortness(trump, SHORT_POINTS),
    // Opener's total with a fit: length points + singletons and voids.
    total: (trump) => pts + shortness(trump, [2, 1]),
    short: (trump) => shortness(trump, SHORT_POINTS),
    keys: (trump) =>
      [0, 1, 2, 3].filter((suit) => has(suit, ACE)).length +
      (has(trump, KING) ? 1 : 0)
  };
}
