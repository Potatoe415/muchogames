// Partnership arithmetic for the later rounds: trump fit, combined points,
// the suit both partners know they agree on.
import { isBid } from "./auction.js";
import {
  CLUBS,
  DIAMONDS,
  HEARTS,
  isMajor,
  NT,
  sideOf,
  SPADES
} from "./cards.js";

export const SUIT_PREFERENCE = [SPADES, HEARTS, DIAMONDS, CLUBS];

// Partner's points as far as the auction shows them; an open-ended range is
// capped so a silent partner is not assumed to hold everything.
export function partnerRange(know) {
  const [low, high] = know.hcp;
  return [low + know.bonus, Math.min(high, low + 10) + know.bonus];
}

export function findFit(h, know) {
  let best = null;
  SUIT_PREFERENCE.forEach((suit) => {
    const total = h.len[suit] + know.len[suit][0];
    if (total < 8) return;
    const score = total + (isMajor(suit) ? 2 : 0);
    if (!best || score > best.score) best = { suit, total, score };
  });
  return best;
}

export function valuation(h, ctx) {
  const know = ctx.know[ctx.partner];
  const fit = findFit(h, know);
  const me = fit ? Math.max(h.total(fit.suit), h.dummy(fit.suit)) : h.pts;
  const [low, high] = partnerRange(know);
  return { fit, me, lo: me + low, hi: me + high, mid: me + (low + high) / 2 };
}

// The trump suit for Blackwood: a known 8-card fit, else the last suit the
// asking side bid.
export function agreedSuit(ctx, seat) {
  const a = ctx.know[seat];
  const b = ctx.know[(seat + 2) % 4];
  let best = null;
  let bestTotal = 0;
  SUIT_PREFERENCE.forEach((suit) => {
    const total = a.len[suit][0] + b.len[suit][0];
    if (total >= 8 && total > bestTotal) {
      best = suit;
      bestTotal = total;
    }
  });
  if (best !== null) return best;
  const last = [...ctx.list]
    .reverse()
    .find(
      (bid) =>
        sideOf(bid.seat) === sideOf(seat) &&
        isBid(bid.call) &&
        bid.strain < NT &&
        !ctx.theirSuits.has(bid.strain)
    );
  return last ? last.strain : null;
}

export const stopsAll = (h, suits) => [...suits].every((suit) => h.stop[suit]);

// Longest suit among `suits`, ties to the higher-ranking one.
export function longestOf(h, suits) {
  return [...suits].sort((a, b) => h.len[b] - h.len[a] || b - a)[0];
}
