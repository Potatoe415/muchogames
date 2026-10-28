// Later rounds: once the system's fixed sequences are over, place the
// contract from combined points — slam (Blackwood), game, invitation or part
// score — compete by the law of total tricks, double them when they overbid.
import { bidCall, bidRank, isBid, parseBid } from "./auction.js";
import { gameLevel } from "./bid-context.js";
import { agreedSuit, longestOf, valuation } from "./bid-eval.js";
import { isMajor, NT, sideOf } from "./cards.js";

const SUITS = [3, 2, 1, 0];

function ntPossible(h, ctx, v) {
  if (v.fit && isMajor(v.fit.suit)) return false;
  const stopped = [...ctx.theirSuits].every((s) => h.stop[s]);
  const pk = ctx.know[ctx.partner];
  const partnerNt = ctx.partners.some((b) => b.strain === NT && isBid(b.call));
  if (partnerNt && !h.len.some((l) => l >= 7)) return true;
  const noLong = !h.len.some((l) => l >= 6);
  return stopped && (h.balanced || pk.bal || (v.lo >= 25 && noLong));
}

function chooseStrain(h, ctx, v) {
  if (v.fit) {
    const minor = !isMajor(v.fit.suit);
    if (minor && v.lo >= 25 && v.lo < 29 && ntPossible(h, ctx, v)) return NT;
    return v.fit.suit;
  }
  if (ntPossible(h, ctx, v)) return NT;
  return SUITS.find((s) => h.len[s] >= 6 && !ctx.theirSuits.has(s)) ?? null;
}

function target(v, strain, ctx) {
  const game = gameLevel(strain);
  const gamePoints = strain < 2 ? 28 : 25;
  if (v.lo >= 33 && !ctx.bwUsed) {
    return { kind: "slam", level: v.lo >= 37 ? 7 : 6 };
  }
  if (v.lo >= gamePoints || ctx.gf) return { kind: "game", level: game };
  if (v.hi >= gamePoints && v.mid >= gamePoints - 2) {
    return { kind: "invite", level: strain < 2 ? 3 : game - 1 };
  }
  return { kind: "part", level: 0 };
}

const ourGameBid = (ctx) =>
  ctx.list.some(
    (b) =>
      isBid(b.call) &&
      sideOf(b.seat) === sideOf(ctx.seat) &&
      b.level >= gameLevel(b.strain)
  );

function penalty(h, ctx, v) {
  const last = ctx.last;
  if (!ctx.legal.has("X") || ctx.ourLast) return null;
  const s = last.strain;
  const stack =
    s < NT && h.len[s] >= 4 && h.q[s] >= 2 && last.level >= 2 && v.lo >= 20;
  const outbid = ourGameBid(ctx) && v.lo >= 24;
  const nt = s === NT && v.lo >= 25;
  return stack || outbid || nt ? "X" : null;
}

// They hold the contract: double, or bid on as far as our fit allows.
function compete(h, ctx, v, strain) {
  const double = penalty(h, ctx, v);
  if (double) return double;
  if (strain === NT) return "P";
  const call = ctx.cheapest(strain);
  if (!call) return "P";
  const cap = v.fit
    ? v.fit.total - 6
    : h.len[strain] >= 6 && h.hcp >= 10
      ? 2
      : 0;
  return parseBid(call).level <= cap && v.lo >= 16 ? call : "P";
}

function partScore(h, ctx, v, strain) {
  if (!ctx.ourLast) return compete(h, ctx, v, strain);
  if (ctx.last.strain === strain || !v.fit || strain !== v.fit.suit) return "P";
  const call = ctx.cheapest(strain);
  return call && parseBid(call).level <= 3 ? call : "P";
}

// Partner already bid a game: only a slam, or a major instead of 3SA, moves.
function partnerBidGame(ctx, strain) {
  const last = ctx.last;
  if (!ctx.ourLast || last.level < gameLevel(last.strain)) return false;
  return !(last.strain === NT && isMajor(strain) && last.level === 3);
}

function reach(h, ctx, v, strain, t) {
  const lastRank = ctx.last ? bidRank(ctx.last.call) : -1;
  if (t.kind !== "slam" && partnerBidGame(ctx, strain)) return "P";
  if (t.kind === "slam") {
    if (v.fit?.suit === strain && ctx.legal.has("4N")) return "4N";
    const call = bidCall(t.level, strain);
    return ctx.legal.has(call) ? call : "P";
  }
  if (t.kind === "part") return partScore(h, ctx, v, strain);
  const call = bidCall(t.level, strain);
  if (bidRank(call) > lastRank) return call;
  if (t.kind === "invite" && v.mid >= 25) {
    const game = bidCall(t.level + 1, strain);
    if (bidRank(game) > lastRank) return game;
  }
  return ctx.ourLast ? "P" : compete(h, ctx, v, strain);
}

function noStrain(h, ctx, v) {
  if (v.lo >= 25 && ctx.legal.has("3N")) return "3N";
  if (!ctx.forced) return ctx.ourLast ? "P" : penalty(h, ctx, v) || "P";
  const fresh = SUITS.filter(
    (s) => h.len[s] >= 4 && !ctx.theirSuits.has(s) && !ctx.ourSuits.has(s)
  );
  const call = fresh.map((s) => ctx.cheapest(s)).find((c) => c && c[0] <= "3");
  return call || null;
}

export function forcedFallback(h, ctx, v) {
  const pk = ctx.know[ctx.partner];
  const partnerSuits = SUITS.filter(
    (s) => pk.len[s][0] >= 4 && h.len[s] >= 2
  ).sort((a, b) => h.len[b] - h.len[a]);
  const tries = [
    ...(v.fit ? [v.fit.suit] : []),
    ...partnerSuits,
    NT,
    longestOf(h, SUITS)
  ];
  for (const strain of tries) {
    const call = ctx.cheapest(strain);
    if (call) return call;
  }
  return [...ctx.legal].find(isBid) || "P";
}

export function placeCall(h, ctx) {
  if (ctx.partnerSignoff) return "P";
  const v = valuation(h, ctx);
  const strain = chooseStrain(h, ctx, v);
  const call =
    strain === null
      ? noStrain(h, ctx, v)
      : reach(h, ctx, v, strain, target(v, strain, ctx));
  if (call && ctx.legal.has(call) && !(call === "P" && ctx.forced)) return call;
  return ctx.forced ? forcedFallback(h, ctx, v) : "P";
}

// Meaning of a call no fixed sequence covers.
export function naturalMeaning(ctx, call) {
  if (call === "P") return { call, shows: {} };
  if (call === "X") return { call, shows: {}, tag: "penalty" };
  if (call === "XX") return { call, shows: {}, tag: "values" };
  const { level, strain } = parseBid(call);
  if (call === "4N" && !ctx.bwUsed) {
    const p = ctx.partnerLast;
    if (p && p.strain === NT && isBid(p.call)) {
      const range = ctx.know[ctx.partner].hcp;
      return {
        call,
        shows: {},
        conv: "quant",
        tag: "quantitative",
        nt: { level: 1, range }
      };
    }
    const trump = agreedSuit(ctx, ctx.seat);
    if (trump !== null) {
      return {
        call,
        shows: {},
        conv: "rkc",
        trump,
        forcing: true,
        tag: "blackwood"
      };
    }
  }
  if (strain === NT)
    return { call, shows: {}, tag: level >= 3 ? "toPlay" : "natural" };
  const partnerLen = ctx.know[ctx.partner].len[strain][0];
  if (partnerLen >= 4 || ctx.partners.some((b) => b.strain === strain)) {
    const need = Math.max(3, 8 - partnerLen);
    return { call, shows: { len: { [strain]: [need, 13] } }, tag: "support" };
  }
  if (ctx.mine.some((b) => b.strain === strain)) {
    return { call, shows: { len: { [strain]: [5, 13] } }, tag: "rebid" };
  }
  return { call, shows: { len: { [strain]: [4, 13] } }, tag: "natural" };
}
