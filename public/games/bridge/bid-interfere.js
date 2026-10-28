// Responder's first call when the opponent on the right interfered over
// partner's one-of-a-suit opening, and opener's answer to a negative double.
import { bidCall } from "./auction.js";
import { entry as E } from "./bid-context.js";
import { longestOf, stopsAll } from "./bid-eval.js";
import { oneSuitResponses } from "./bid-respond.js";
import {
  between,
  CLUBS,
  DIAMONDS,
  HEARTS,
  isMajor,
  NT,
  SPADES
} from "./cards.js";

const levelOf = (call) => Number(call[0]);
const MAJORS = [SPADES, HEARTS];

function fitBids(ctx, o) {
  const need = isMajor(o) ? 3 : 4;
  const raise = ctx.cheapest(o);
  const cue = [...ctx.theirSuits]
    .map((t) => ctx.cheapest(t))
    .find((call) => call && levelOf(call) <= 3);
  const game = isMajor(o) ? bidCall(4, o) : null;
  return [
    cue &&
      E(
        cue,
        (h) => h.len[o] >= need && h.dummy(o) >= 11,
        { hcp: [11, 37], len: { [o]: [need, 13] } },
        {
          tag: "cueFit",
          forcing: true
        }
      ),
    game &&
      ctx.legal.has(game) &&
      E(
        game,
        (h) => h.len[o] >= 4 && h.hcp <= 9 && h.short(o) >= 2,
        { len: { [o]: [4, 13] } },
        {
          tag: "preemptRaise"
        }
      ),
    raise &&
      E(
        raise,
        (h) => h.len[o] >= need && between(h.dummy(o), 6, 10),
        { hcp: [6, 10], len: { [o]: [need, 13] } },
        {
          tag: "raise"
        }
      )
  ].filter(Boolean);
}

// Negative double: four cards in the unbid major(s), or values otherwise.
function negativeDouble(ctx, o) {
  const t = ctx.last.strain;
  if (!ctx.legal.has("X") || t === NT || ctx.last.level > 2) return [];
  const majors = MAJORS.filter((m) => m !== o && m !== t);
  const min = ctx.last.level === 1 ? 6 : 8;
  const shape = (h) =>
    majors.length
      ? majors.every((m) => h.len[m] >= 4)
      : h.len[CLUBS] >= 4 && h.len[DIAMONDS] >= 4;
  const len = Object.fromEntries(majors.map((m) => [m, [4, 13]]));
  return [
    E(
      "X",
      (h) => shape(h) && h.hcp >= min && h.len[o] < (isMajor(o) ? 3 : 5),
      { hcp: [min, 37], len },
      {
        conv: "spoutnik",
        forcing: true,
        tag: "negativeDouble"
      }
    )
  ];
}

function newSuits(ctx, o) {
  return [SPADES, HEARTS, DIAMONDS, CLUBS]
    .filter((s) => s !== o && !ctx.theirSuits.has(s))
    .map((s) => {
      const call = ctx.cheapest(s);
      if (!call) return null;
      const one = levelOf(call) === 1;
      const need = one ? 4 : 5;
      const min = one ? 6 : 11;
      return E(
        call,
        (h) => h.len[s] >= need && h.hcp >= min,
        { hcp: [min, 37], len: { [s]: [need, 13] } },
        {
          forcing: true
        }
      );
    })
    .filter(Boolean);
}

function ntBids(ctx) {
  const call = ctx.cheapest(NT);
  if (!call) return [];
  const ranges = { 1: [8, 10], 2: [11, 12], 3: [13, 15] };
  const range = ranges[levelOf(call)];
  if (!range) return [];
  return [
    E(
      call,
      (h) => between(h.hcp, ...range) && stopsAll(h, ctx.theirSuits),
      { hcp: range },
      levelOf(call) === 3 ? { signoff: true } : {}
    )
  ];
}

export function competitiveResponses(ctx) {
  const o = ctx.opener.strain;
  const rhoCall = ctx.calls[ctx.calls.length - 1];
  if (rhoCall === "X") {
    return [
      E("XX", (h) => h.hcp >= 11, { hcp: [11, 37] }, { tag: "values" }),
      ...oneSuitResponses(o)
    ];
  }
  if (ctx.last.strain === NT) {
    return [
      E("X", (h) => h.hcp >= 9, { hcp: [9, 37] }, { tag: "penalty" }),
      ...fitBids(ctx, o),
      E("P", () => true)
    ];
  }
  return [
    ...fitBids(ctx, o),
    ...negativeDouble(ctx, o),
    ...newSuits(ctx, o),
    ...ntBids(ctx),
    E("P", () => true)
  ];
}

export function negativeDoubleAnswers(ctx) {
  const o = ctx.myLast.strain;
  const t = [...ctx.theirSuits][0];
  const majors = MAJORS.filter((m) => m !== o && !ctx.theirSuits.has(m));
  const list = [];
  majors.forEach((m) => {
    const call = ctx.cheapest(m);
    const jump = ctx.cheapest(m, 1);
    if (jump)
      list.push(
        E(jump, (h) => h.len[m] >= 4 && h.pts >= 16, {
          len: { [m]: [4, 13] },
          hcp: [16, 20]
        })
      );
    if (call)
      list.push(E(call, (h) => h.len[m] >= 4, { len: { [m]: [4, 13] } }));
  });
  const nt = ctx.cheapest(NT);
  if (nt && t !== undefined)
    list.push(E(nt, (h) => h.balanced && h.stop[t], { bal: true }));
  const own = ctx.cheapest(o);
  if (own) list.push(E(own, (h) => h.len[o] >= 6, { len: { [o]: [6, 13] } }));
  const minors = [DIAMONDS, CLUBS].filter(
    (s) => s !== o && !ctx.theirSuits.has(s)
  );
  minors.forEach((s) => {
    const call = ctx.cheapest(s);
    if (call)
      list.push(
        E(call, (h) => h.len[s] >= 4 && longestOf(h, minors) === s, {
          len: { [s]: [4, 13] }
        })
      );
  });
  if (own) list.push(E(own, () => true));
  return list;
}
