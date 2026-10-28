// The auction seen from the seat about to call: every player's calls, what
// each call showed (inference), forcing state and small helpers the bidding
// rules share.
import {
  bidCall,
  isBid,
  legalCalls,
  parseBid,
  readAuction,
  seatOfCall
} from "./auction.js";
import { NT, nextSeat, partnerOf, sideOf } from "./cards.js";

const FULL = [0, 37];

export function freshKnowledge() {
  return {
    hcp: [...FULL],
    len: [0, 1, 2, 3].map(() => [0, 13]),
    bonus: 0,
    bal: false
  };
}

function narrow([low, high], [min, max]) {
  const a = Math.max(low, min);
  const b = Math.min(high, max);
  return a <= b ? [a, b] : [min, max];
}

export function applyShows(know, shows) {
  if (!shows) return;
  if (shows.hcp) know.hcp = narrow(know.hcp, shows.hcp);
  Object.entries(shows.len || {}).forEach(([suit, range]) => {
    know.len[suit] = narrow(know.len[suit], range);
  });
  if (shows.bal) {
    know.bal = true;
    know.len = know.len.map((range) => narrow(range, [2, 5]));
  }
  if (shows.bonus) know.bonus = Math.max(know.bonus, shows.bonus);
}

function callList(dealer, calls, metas) {
  return calls.map((call, index) => ({
    call,
    index,
    seat: seatOfCall(dealer, index),
    meta: metas[index] || {},
    ...(parseBid(call) || {})
  }));
}

const suitsOf = (list) =>
  new Set(
    list.filter((b) => isBid(b.call) && b.strain < NT).map((b) => b.strain)
  );

function cheapestFinder(last, legal) {
  return (strain, jump = 0) => {
    const base = !last ? 1 : strain > last.strain ? last.level : last.level + 1;
    const level = base + jump;
    if (level > 7) return null;
    const call = bidCall(level, strain);
    return legal.has(call) ? call : null;
  };
}

export const gameLevel = (strain) => (strain === NT ? 3 : strain >= 2 ? 4 : 5);

function forcingState(ctx, n) {
  const p = ctx.partnerLast;
  const partnerJust = Boolean(p) && p.index === n - 2;
  const rhoPassed = n > 0 && ctx.calls[n - 1] === "P";
  const ours = Boolean(ctx.last) && sideOf(ctx.last.seat) === sideOf(ctx.seat);
  const belowGame = ours && ctx.last.level < gameLevel(ctx.last.strain);
  return {
    partnerJust,
    rhoPassed,
    ourLast: ours,
    forced:
      rhoPassed &&
      ((partnerJust && Boolean(p.meta.forcing)) || (ctx.gf && belowGame))
  };
}

export function makeContext(dealer, vul, calls, know, metas) {
  const seat = seatOfCall(dealer, calls.length);
  const list = callList(dealer, calls, metas);
  const made = list.filter((b) => b.call !== "P");
  const by = (who) => made.filter((b) => b.seat === who);
  const side = sideOf(seat);
  const ours = made.filter((b) => sideOf(b.seat) === side);
  const theirs = made.filter((b) => sideOf(b.seat) !== side);
  const legal = new Set(legalCalls(dealer, calls));
  const last = readAuction(dealer, calls).last;
  const ctx = {
    dealer,
    calls,
    list,
    seat,
    partner: partnerOf(seat),
    lho: nextSeat(seat),
    rho: nextSeat(seat, 3),
    legal,
    last,
    know,
    vul: { we: Boolean(vul[side]), they: Boolean(vul[1 - side]) },
    opener: made.find((b) => isBid(b.call)) || null,
    mine: by(seat),
    partners: by(partnerOf(seat)),
    theirs,
    ourSuits: suitsOf(ours),
    theirSuits: suitsOf(theirs),
    gf: ours.some((b) => b.meta.gf),
    bwUsed: ours.some((b) => b.meta.conv === "rkc"),
    cheapest: cheapestFinder(last, legal)
  };
  ctx.partnerLast = ctx.partners[ctx.partners.length - 1] || null;
  ctx.myLast = ctx.mine[ctx.mine.length - 1] || null;
  Object.assign(ctx, forcingState(ctx, calls.length));
  ctx.partnerSignoff = ctx.partnerJust && Boolean(ctx.partnerLast.meta.signoff);
  return ctx;
}

// Rule entries: a call, the hand test that picks it and what it shows.
export const entry = (call, test, shows = {}, extra = {}) => ({
  call,
  test,
  shows,
  ...extra
});
