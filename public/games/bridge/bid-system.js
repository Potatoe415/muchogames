// The bidding system as one entry point: picks the situation, chooses a call
// for a hand, explains any call (the robots read the human's calls with the
// same rules), and replays an auction to learn what every call showed.
import { isBid } from "./auction.js";
import {
  advanceDouble,
  advanceOvercall,
  overcallEntries
} from "./bid-compete.js";
import {
  applyShows,
  entry as E,
  freshKnowledge,
  makeContext
} from "./bid-context.js";
import {
  competitiveResponses,
  negativeDoubleAnswers
} from "./bid-interfere.js";
import {
  isNtConv,
  ntOpenerAnswers,
  ntResponses,
  staymanAnswers,
  staymanFollowUps,
  texasAnswer,
  texasFollowUps
} from "./bid-nt.js";
import { openingEntries } from "./bid-open.js";
import { naturalMeaning, placeCall } from "./bid-place.js";
import { openerRebids } from "./bid-rebid.js";
import { oneSuitResponses } from "./bid-respond.js";
import {
  keycardAnswers,
  keycardFollowUps,
  preemptResponses,
  relayAnswer,
  strongRebids,
  weakTwoAnswers,
  weakTwoResponses
} from "./bid-strong.js";
import { evaluateHand, NT, sideOf } from "./cards.js";

function partnerConvention(ctx, p) {
  const m = p.meta;
  const mine = ctx.myLast;
  if (m.signoff) return [E("P", () => true)];
  if (m.conv === "stayman") return staymanAnswers(m.nt.level);
  if (m.conv === "texas") return texasAnswer(m);
  if (m.conv === "rkc") return keycardAnswers(m.trump);
  if (m.conv === "weakAsk") return weakTwoAnswers(m.target);
  if (m.conv === "spoutnik" && mine) return negativeDoubleAnswers(ctx);
  if (m.conv === "relay" && (mine?.call === "2C" || mine?.call === "2D")) {
    return strongRebids(mine.call);
  }
  if (isNtConv(m)) return ntOpenerAnswers(m, mine?.meta);
  if (m.nt && m.tag === "balanced") return ntResponses(2, m.nt.range, ctx.gf);
  return null;
}

function myConventionAnswered(ctx) {
  const mm = ctx.myLast?.meta;
  if (!mm) return null;
  if (mm.conv === "stayman") return staymanFollowUps(mm, ctx.partnerLast);
  if (mm.conv === "texas") return texasFollowUps(mm);
  if (mm.conv === "rkc") {
    return keycardFollowUps(ctx, mm.trump, ctx.partnerLast.call);
  }
  return null;
}

function conventionReply(ctx) {
  if (!ctx.partnerJust || !ctx.rhoPassed) return null;
  return partnerConvention(ctx, ctx.partnerLast) || myConventionAnswered(ctx);
}

function responseEntries(ctx) {
  const open = ctx.opener;
  const quiet = ctx.theirs.length === 0;
  if (open.call === "1N") return quiet ? ntResponses(1, [15, 17]) : [];
  if (open.call === "2N") return quiet ? ntResponses(2, [20, 21]) : [];
  if (open.call === "2C") return quiet ? relayAnswer("2D") : [];
  if (open.call === "2D") return quiet ? relayAnswer("2H") : [];
  if (open.level === 2) return quiet ? weakTwoResponses(open.strain) : [];
  if (open.level >= 3) return preemptResponses(open);
  return quiet ? oneSuitResponses(open.strain) : competitiveResponses(ctx);
}

function defenceEntries(ctx) {
  if (ctx.mine.length) return [];
  if (!ctx.partners.length) return overcallEntries(ctx);
  if (ctx.partners.length !== 1) return [];
  const p = ctx.partnerLast;
  if (p.meta.conv === "takeout") return advanceDouble(ctx);
  if (p.meta.tag === "ntOvercall") {
    return ctx.rhoPassed ? ntResponses(1, p.meta.nt.range) : [];
  }
  return isBid(p.call) && p.strain < NT ? advanceOvercall(ctx) : [];
}

export function situationEntries(ctx) {
  if (!ctx.opener) return openingEntries(ctx);
  const reply = conventionReply(ctx);
  if (reply) return reply;
  if (sideOf(ctx.opener.seat) !== sideOf(ctx.seat)) return defenceEntries(ctx);
  if (ctx.opener.seat === ctx.partner && !ctx.mine.length) {
    return responseEntries(ctx);
  }
  const rebid =
    ctx.opener.seat === ctx.seat &&
    ctx.mine.length === 1 &&
    ctx.partners.length === 1 &&
    !ctx.theirs.length &&
    ctx.opener.level === 1 &&
    ctx.opener.strain < NT;
  return rebid ? openerRebids(ctx) : [];
}

function metaOf(entry) {
  const meta = { ...entry };
  delete meta.test;
  return meta;
}

export function explainCall(ctx, call) {
  const found = situationEntries(ctx).find(
    (e) => e.call === call && ctx.legal.has(call)
  );
  return found ? metaOf(found) : naturalMeaning(ctx, call);
}

export function chooseCall(h, ctx) {
  for (const e of situationEntries(ctx)) {
    if (!ctx.legal.has(e.call)) continue;
    if (e.call === "P" && ctx.forced && !e.penalty) continue;
    if (e.test(h)) return { call: e.call, meta: metaOf(e) };
  }
  const call = placeCall(h, ctx);
  return { call, meta: explainCall(ctx, call) };
}

// What every call showed, in order, and each player's knowledge at the end.
export function analyzeAuction(dealer, vul, calls) {
  const know = [0, 1, 2, 3].map(freshKnowledge);
  const metas = [];
  calls.forEach((call, index) => {
    const ctx = makeContext(dealer, vul, calls.slice(0, index), know, metas);
    const meta = explainCall(ctx, call);
    metas.push(meta);
    applyShows(know[ctx.seat], meta.shows);
  });
  return { know, metas };
}

export function bidFor(cards, dealer, vul, calls) {
  const { know, metas } = analyzeAuction(dealer, vul, calls);
  const ctx = makeContext(dealer, vul, calls, know, metas);
  return chooseCall(evaluateHand(cards), ctx);
}
