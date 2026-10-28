// Strong and weak openings' sequences: 2♣ and 2♦ with their relays, weak
// twos (2SA asks), preempts, and Blackwood with five key cards (41-30).
import { bidCall } from "./auction.js";
import { entry as E } from "./bid-context.js";
import { longestOf, valuation } from "./bid-eval.js";
import { isMajor, QUEEN } from "./cards.js";

const CODE = "CDHS";
const ALL_SUITS = [3, 2, 1, 0];

export const relayAnswer = (call) => [
  E(call, () => true, {}, { tag: "relay", conv: "relay" })
];

// Opener's rebid after 2♣-2♦ or 2♦-2♥: balanced → 2SA, else longest suit.
export function strongRebids(opening) {
  const strong2c = opening === "2C";
  const range = strong2c ? [22, 23] : [24, 27];
  const calls = strong2c
    ? { 3: "2S", 2: "2H", 1: "3D", 0: "3C" }
    : { 3: "2S", 2: "3H", 1: "3D", 0: "3C" };
  return [
    E(
      "2N",
      (h) => h.balanced && (!strong2c || h.hcp <= 23),
      { hcp: range, bal: true },
      { tag: "balanced", nt: { level: 2, range } }
    ),
    ...ALL_SUITS.map((suit) =>
      E(
        calls[suit],
        (h) => longestOf(h, ALL_SUITS) === suit,
        { len: { [suit]: [5, 13] } },
        { forcing: true }
      )
    )
  ];
}

export function weakTwoResponses(m) {
  const c = CODE[m];
  return [
    E(
      `4${c}`,
      (h) =>
        (h.len[m] >= 3 && h.dummy(m) >= 16) || (h.len[m] >= 4 && h.hcp <= 12),
      {},
      { signoff: true }
    ),
    E(
      "2N",
      (h) => h.hcp >= 15,
      { hcp: [15, 37] },
      {
        conv: "weakAsk",
        forcing: true,
        tag: "ask",
        target: m
      }
    ),
    E(
      `3${c}`,
      (h) => h.len[m] >= 3 && h.hcp <= 14,
      { len: { [m]: [3, 13] } },
      {
        tag: "preemptRaise",
        signoff: true
      }
    ),
    E("P", () => true, { hcp: [0, 14] })
  ];
}

export const weakTwoAnswers = (m) => [
  E("3N", (h) => h.hcp >= 9, { hcp: [9, 10] }, { tag: "maximum" }),
  E(`3${CODE[m]}`, () => true, { hcp: [6, 8] }, { tag: "minimum" })
];

export function preemptResponses(opening) {
  const s = opening.strain;
  const c = CODE[s];
  if (opening.level >= 4) return [E("P", () => true)];
  if (isMajor(s)) {
    const game = (h) =>
      (h.len[s] >= 2 && h.hcp >= 15) || (h.len[s] >= 3 && h.short(s) >= 2);
    return [E(`4${c}`, game, {}, { signoff: true }), E("P", () => true)];
  }
  const stoppers = (h) =>
    [0, 1, 2, 3].filter((x) => x !== s && h.stop[x]).length >= 2;
  return [
    E("3N", (h) => h.hcp >= 16 && stoppers(h), {}, { signoff: true }),
    E(
      `5${c}`,
      (h) => h.len[s] >= 3 && (h.hcp >= 16 || h.short(s) >= 3),
      {},
      { signoff: true }
    ),
    E("P", () => true)
  ];
}

export function keycardAnswers(trump) {
  const queen = (h) => h.has(trump, QUEEN);
  const keys = (h) => h.keys(trump);
  return [
    E("5C", (h) => [1, 4].includes(keys(h)), {}, { tag: "keys14" }),
    E("5D", (h) => [0, 3].includes(keys(h)), {}, { tag: "keys03" }),
    E("5H", (h) => keys(h) === 2 && !queen(h), {}, { tag: "keys2" }),
    E("5S", (h) => keys(h) >= 2 && queen(h), {}, { tag: "keys2q" }),
    E("5C", () => true, {}, { tag: "keys14" })
  ];
}

const ANSWER_KEYS = { "5C": [1, 4], "5D": [0, 3], "5H": [2], "5S": [2] };

// Partner's key cards: of the two readings, the one closer to what our
// combined points suggest (about seven points a key card).
function partnerKeys(h, ctx, trump, answer) {
  const options = ANSWER_KEYS[answer] || [0];
  const mine = h.keys(trump);
  const possible = options.filter((k) => k + mine <= 5);
  if (possible.length < 2) return possible[0] ?? Math.min(...options);
  const [low, high] = ctx.know[ctx.partner].hcp;
  const expected = (h.hcp + (low + Math.min(high, low + 6)) / 2) / 7;
  return possible.reduce((best, k) =>
    Math.abs(mine + k - expected) < Math.abs(mine + best - expected) ? k : best
  );
}

export function keycardFollowUps(ctx, trump, answer) {
  const c = CODE[trump];
  const missing = (h) => 5 - h.keys(trump) - partnerKeys(h, ctx, trump, answer);
  const queen = (h) => answer === "5S" || h.has(trump, QUEEN);
  const grand = (h) =>
    missing(h) === 0 && queen(h) && valuation(h, ctx).lo >= 36;
  return [
    E(`7${c}`, grand, {}, { signoff: true }),
    E(`6${c}`, (h) => missing(h) <= 1, {}, { signoff: true }),
    E(bidCall(5, trump), () => true, {}, { signoff: true, tag: "signoff" }),
    E(`6${c}`, () => true, {}, { signoff: true })
  ];
}
