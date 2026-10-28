// What a robot knows during the play — its own cards, dummy, everything
// played, who showed out — and the card helpers the play rules share.
import { isBid, seatOfCall } from "./auction.js";
import { NT, partnerOf, rankOf, sideOf, suitOf } from "./cards.js";
import { beats, winningPlay } from "./deal.js";

export const suitCards = (cards, suit) =>
  cards.filter((c) => suitOf(c) === suit).sort((a, b) => rankOf(b) - rankOf(a));

export const lowest = (cards) =>
  cards.reduce((a, b) => (rankOf(b) < rankOf(a) ? b : a));

export const highest = (cards) =>
  cards.reduce((a, b) => (rankOf(b) > rankOf(a) ? b : a));

export function prepareView(view) {
  const played = new Set();
  const playedBy = [[], [], [], []];
  const voids = [0, 1, 2, 3].map(() => [false, false, false, false]);
  const record = (plays) => {
    const led = suitOf(plays[0].card);
    plays.forEach(({ seat, card }) => {
      played.add(card);
      playedBy[seat].push(card);
      if (suitOf(card) !== led) voids[seat][led] = true;
    });
  };
  view.tricks.forEach((t) => record(t.plays));
  if (view.trick.length) record(view.trick);
  const side = sideOf(view.seat);
  const ours = new Set();
  Object.entries(view.hands).forEach(([seat, cards]) => {
    if (sideOf(Number(seat)) === side) cards.forEach((c) => ours.add(c));
  });
  const outside = [];
  for (let c = 0; c < 52; c += 1) {
    if (!played.has(c) && !ours.has(c)) outside.push(c);
  }
  return { ...view, played, playedBy, voids, outside, ours };
}

export const isDeclarerSide = (v) => sideOf(v.seat) === sideOf(v.declarer);

// No card left outside our visible cards beats it in its suit.
export const isMaster = (v, card) =>
  !v.outside.some(
    (c) => suitOf(c) === suitOf(card) && rankOf(c) > rankOf(card)
  );

export const higherOutside = (v, card) =>
  v.outside.filter(
    (c) => suitOf(c) === suitOf(card) && rankOf(c) > rankOf(card)
  ).length;

export const cheapestBeating = (cards, best, trump) => {
  const winners = cards.filter((c) => beats(c, best, trump));
  return winners.length ? lowest(winners) : null;
};

export const currentWinner = (v) => winningPlay(v.trick, v.trump);

// The lowest card of mine that is as good as `top` (no outside card between).
export function equalBelow(v, cards, top) {
  const suit = suitCards(cards, suitOf(top));
  let pick = top;
  for (const card of suit) {
    if (rankOf(card) >= rankOf(pick)) continue;
    const gap = v.outside.some(
      (c) =>
        suitOf(c) === suitOf(top) &&
        rankOf(c) < rankOf(pick) &&
        rankOf(c) > rankOf(card)
    );
    if (gap) break;
    pick = card;
  }
  return pick;
}

export const visibleHand = (v, seat) => v.hands[seat] || null;

export function suitsBid(v) {
  const bids = [0, 1, 2, 3].map(() => new Set());
  v.calls.forEach((call, i) => {
    if (isBid(call) && call[1] !== "N") {
      bids[seatOfCall(v.dealer, i)].add("CDHS".indexOf(call[1]));
    }
  });
  return bids;
}

// Tricks this side still needs: declarer to make, defenders to set.
export function tricksNeeded(v) {
  const side = sideOf(v.seat);
  const target = isDeclarerSide(v)
    ? v.contract.level + 6
    : 8 - v.contract.level;
  return target - v.won[side];
}

export const opponentTrumps = (v) =>
  v.trump === NT || v.trump < 0
    ? 0
    : v.outside.filter((c) => suitOf(c) === v.trump).length;

export const partnerSeat = (v) => partnerOf(v.seat);
