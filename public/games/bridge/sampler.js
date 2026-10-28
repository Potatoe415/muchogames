// Deals the cards a robot cannot see among the hidden hands, consistent with
// who showed out of which suit and, as far as possible, with the auction.
import { hcpOf, shuffle, suitLengths, suitOf } from "./cards.js";

function hiddenSeats(v) {
  return [0, 1, 2, 3].filter((seat) => !v.hands[seat]);
}

function unseenCards(v) {
  const seen = new Set(v.played);
  Object.values(v.hands).forEach((cards) => cards.forEach((c) => seen.add(c)));
  const list = [];
  for (let c = 0; c < 52; c += 1) if (!seen.has(c)) list.push(c);
  return list;
}

function tryDeal(pool, seats, need, voids) {
  const hands = Object.fromEntries(seats.map((s) => [s, []]));
  const left = { ...need };
  for (const card of shuffle(pool)) {
    const open = seats.filter((s) => left[s] > 0 && !voids[s][suitOf(card)]);
    if (!open.length) return null;
    const total = open.reduce((sum, s) => sum + left[s], 0);
    let pick = Math.random() * total;
    const seat =
      open.find((s) => (pick -= left[s]) < 0) ?? open[open.length - 1];
    hands[seat].push(card);
    left[seat] -= 1;
  }
  return hands;
}

function fitsAuction(hands, v, know) {
  return Object.entries(hands).every(([seat, cards]) => {
    const k = know[seat];
    const all = [...cards, ...v.playedBy[seat]];
    const hcp = hcpOf(all);
    const len = suitLengths(all);
    return (
      hcp >= k.hcp[0] - 2 &&
      hcp <= k.hcp[1] + 2 &&
      len.every((l, s) => l >= k.len[s][0] - 1 && l <= k.len[s][1] + 1)
    );
  });
}

// → four remaining hands, or null when no consistent layout was found.
export function sampleLayout(v, know, tries = 60) {
  const seats = hiddenSeats(v);
  const pool = unseenCards(v);
  const need = Object.fromEntries(seats.map((s) => [s, v.counts[s]]));
  let fallback = null;
  for (let i = 0; i < tries; i += 1) {
    const hands = tryDeal(pool, seats, need, v.voids);
    if (!hands) continue;
    fallback = hands;
    if (fitsAuction(hands, v, know)) break;
  }
  if (!fallback) return null;
  return [0, 1, 2, 3].map((seat) => v.hands[seat] || fallback[seat]);
}
