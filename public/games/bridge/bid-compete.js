// Competitive bidding: overcalls and takeout doubles over their opening,
// partner's answers to them, and responder's calls after an overcall
// (including the negative double, "Spoutnik").
import { bidCall } from "./auction.js";
import { entry as E } from "./bid-context.js";
import { longestOf, stopsAll } from "./bid-eval.js";
import {
  between,
  CLUBS,
  DIAMONDS,
  HEARTS,
  isMajor,
  NT,
  SPADES
} from "./cards.js";

const SUITS_HIGH_FIRST = [SPADES, HEARTS, DIAMONDS, CLUBS];
const levelOf = (call) => Number(call[0]);
const lowCall = (call, maxLevel) =>
  call && levelOf(call) <= maxLevel ? call : null;

function ntOvercall(ctx, adjust) {
  const call = ctx.cheapest(NT);
  if (!call || levelOf(call) > 1) return [];
  const range = adjust ? [11, 14] : [15, 18];
  return [
    E(
      call,
      (h) =>
        h.balanced && between(h.hcp, ...range) && stopsAll(h, ctx.theirSuits),
      { hcp: range, bal: true },
      { tag: "ntOvercall", nt: { level: 1, range } }
    )
  ];
}

function takeoutDouble(ctx, adjust) {
  if (!ctx.legal.has("X") || ctx.last.level > 3 || ctx.last.strain === NT)
    return [];
  const theirs = [...ctx.theirSuits];
  const unbid = [0, 1, 2, 3].filter((s) => !ctx.theirSuits.has(s));
  const shape = (h) =>
    theirs.every((s) => h.len[s] <= 2) && unbid.every((s) => h.len[s] >= 3);
  return [
    E(
      "X",
      (h) => (shape(h) && h.hcp >= 12 - adjust) || h.hcp >= 17,
      { hcp: [12 - adjust, 37] },
      { conv: "takeout", forcing: true, tag: "takeout" }
    )
  ];
}

function suitOvercalls(ctx, adjust) {
  const candidates = SUITS_HIGH_FIRST.filter((s) => !ctx.theirSuits.has(s));
  const best = (h, s) => longestOf(h, candidates) === s;
  const list = [];
  candidates.forEach((s) => {
    const call = ctx.cheapest(s);
    if (!call) return;
    const level = levelOf(call);
    const range =
      level === 1
        ? [8 - adjust, 16]
        : level === 2
          ? [11 - adjust, 16]
          : [13, 16];
    const long = level >= 3 ? 6 : 5;
    const good = (h) =>
      best(h, s) &&
      h.len[s] >= long &&
      between(h.hcp, ...range) &&
      (h.q[s] >= 2 || h.len[s] >= 6);
    list.push(
      E(
        call,
        good,
        { hcp: range, len: { [s]: [long, 13] } },
        { tag: "overcall" }
      )
    );
  });
  return list;
}

function weakJumps(ctx) {
  const list = [];
  SUITS_HIGH_FIRST.filter((s) => !ctx.theirSuits.has(s)).forEach((s) => {
    const call = ctx.cheapest(s, 1);
    if (!call || levelOf(call) > 3) return;
    const weak = (h) => h.len[s] >= 6 && between(h.hcp, 6, 10) && h.q[s] >= 2;
    list.push(
      E(
        call,
        weak,
        { hcp: [6, 10], len: { [s]: [6, 13] } },
        { tag: "weakJump" }
      )
    );
  });
  return list;
}

// Our first call after they opened. In balancing seat (their opening
// followed by two passes) every range is three points lighter.
export function overcallEntries(ctx) {
  const last = ctx.last;
  const n = ctx.calls.length;
  const balancing = last.index === n - 3 && ctx.rhoPassed;
  const adjust = balancing ? 3 : 0;
  if (last.strain === NT) {
    return [
      E("X", (h) => h.hcp >= 15, { hcp: [15, 37] }, { tag: "penalty" }),
      ...suitOvercalls(ctx, 0),
      E("P", () => true)
    ];
  }
  return [
    ...ntOvercall(ctx, adjust),
    ...suitOvercalls(ctx, adjust),
    ...takeoutDouble(ctx, adjust),
    ...(balancing ? [] : weakJumps(ctx)),
    E("P", () => true, { hcp: [0, 16] })
  ];
}

function ntAnswers(ctx, stopSuits, ranges) {
  return [1, 2, 3]
    .map((level, i) => {
      const call = bidCall(level, NT);
      if (!ctx.legal.has(call) || ctx.cheapest(NT) !== call) return null;
      const range = ranges[i];
      return E(
        call,
        (h) => between(h.hcp, ...range) && stopsAll(h, stopSuits),
        { hcp: range },
        level === 3 ? { signoff: true } : {}
      );
    })
    .filter(Boolean);
}

export function advanceOvercall(ctx) {
  const s = ctx.partnerLast.strain;
  const raise = ctx.cheapest(s);
  const jump = lowCall(ctx.cheapest(s, 1), 4);
  const cue = lowCall(
    [...ctx.theirSuits].map((t) => ctx.cheapest(t)).find(Boolean),
    3
  );
  const others = SUITS_HIGH_FIRST.filter(
    (x) => x !== s && !ctx.theirSuits.has(x)
  );
  return [
    cue &&
      E(
        cue,
        (h) => h.len[s] >= 3 && h.dummy(s) >= 11,
        { hcp: [11, 37], len: { [s]: [3, 13] } },
        {
          tag: "cueFit",
          forcing: true
        }
      ),
    jump &&
      E(
        jump,
        (h) => h.len[s] >= 4 && h.hcp <= 9 && h.short(s) >= 1,
        { len: { [s]: [4, 13] } },
        {
          tag: "preemptRaise"
        }
      ),
    raise &&
      E(
        raise,
        (h) => h.len[s] >= 3 && between(h.dummy(s), 6, 10),
        { hcp: [6, 10], len: { [s]: [3, 13] } },
        {
          tag: "raise"
        }
      ),
    ...ntAnswers(ctx, ctx.theirSuits, [
      [8, 11],
      [12, 14],
      [15, 25]
    ]),
    ...others.map((x) => {
      const call = ctx.cheapest(x);
      return (
        call &&
        E(
          call,
          (h) =>
            longestOf(h, others) === x &&
            h.len[x] >= 5 &&
            h.hcp >= 8 &&
            h.q[x] >= 2,
          {
            len: { [x]: [5, 13] },
            hcp: [8, 16]
          }
        )
      );
    }),
    E("P", () => true, { hcp: [0, 10] })
  ].filter(Boolean);
}

export function advanceDouble(ctx) {
  const free = !ctx.rhoPassed;
  const unbid = SUITS_HIGH_FIRST.filter((s) => !ctx.theirSuits.has(s));
  const best = (h) =>
    unbid.reduce((a, b) =>
      h.len[b] + (isMajor(b) ? 0.5 : 0) > h.len[a] + (isMajor(a) ? 0.5 : 0)
        ? b
        : a
    );
  const their = [...ctx.theirSuits][0];
  const cue = their !== undefined ? lowCall(ctx.cheapest(their), 3) : null;
  const list = [];
  if (!free && cue) {
    list.push(
      E(
        cue,
        (h) => h.hcp >= 12,
        { hcp: [12, 37] },
        { tag: "cueStrong", forcing: true }
      )
    );
  }
  if (!free)
    list.push(
      ...ntAnswers(ctx, ctx.theirSuits, [
        [6, 9],
        [10, 12],
        [13, 25]
      ])
    );
  unbid.forEach((s) => {
    const jump = ctx.cheapest(s, 1);
    if (jump && levelOf(jump) <= 3) {
      list.push(
        E(
          jump,
          (h) => best(h) === s && h.len[s] >= 4 && between(h.hcp, 9, 11),
          {
            hcp: [9, 11],
            len: { [s]: [4, 13] }
          },
          { tag: "invite" }
        )
      );
    }
  });
  if (!free && their !== undefined) {
    const sit = (h) => h.len[their] >= 5 && h.q[their] >= 3 && h.hcp >= 8;
    list.push(E("P", sit, {}, { tag: "penaltyPass", penalty: true }));
  }
  unbid.forEach((s) => {
    const call = ctx.cheapest(s);
    if (call) {
      list.push(
        E(call, (h) => best(h) === s && (!free || h.hcp >= 6), {
          hcp: free ? [6, 10] : [0, 8],
          len: { [s]: [4, 13] }
        })
      );
    }
  });
  list.push(E("P", () => true, { hcp: [0, 5] }));
  return list;
}
