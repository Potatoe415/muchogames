// Opener's second call after one of a suit and an uncontested response:
// support, a new suit (a reverse shows 17+), notrump by range, or the suit
// again.
import { bidCall } from "./auction.js";
import { entry as E } from "./bid-context.js";
import { DIAMONDS, HEARTS, isMajor, NT, SPADES } from "./cards.js";

const CODE = "CDHS";
const SIGNOFF = { signoff: true };

function majorRaiseRebids(o, level) {
  const c = CODE[o];
  if (level === 2) {
    return [
      E(`4${c}`, (h) => h.total(o) >= 19, { hcp: [18, 23] }, SIGNOFF),
      E(`3${c}`, (h) => h.total(o) >= 16, { hcp: [15, 17] }, { tag: "invite" }),
      E("P", () => true, { hcp: [11, 15] })
    ];
  }
  if (level === 3) {
    return [
      E(`4${c}`, (h) => h.total(o) >= 14, {}, SIGNOFF),
      E("P", () => true)
    ];
  }
  return [E("P", () => true)];
}

function minorRaiseRebids(o, level) {
  const c = CODE[o];
  if (level === 2) {
    return [
      E(
        "2N",
        (h) => h.balanced && h.hcp >= 18,
        { hcp: [18, 19] },
        {
          tag: "invite"
        }
      ),
      E(`3${c}`, (h) => h.total(o) >= 16, { hcp: [15, 18] }, { tag: "invite" }),
      E("P", () => true)
    ];
  }
  if (level === 3) {
    const stops = (h) => [0, 1, 2, 3].filter((s) => h.stop[s]).length >= 3;
    return [
      E("3N", (h) => h.hcp >= 14 && stops(h), {}, SIGNOFF),
      E(`5${c}`, (h) => h.total(o) >= 18, {}, SIGNOFF),
      E("P", () => true)
    ];
  }
  return [E("P", () => true)];
}

const fit2nAnswers = (o) => [
  E(
    `3${CODE[o]}`,
    (h) => h.total(o) >= 17,
    { hcp: [16, 23] },
    {
      tag: "slamInterest",
      forcing: true
    }
  ),
  E(`4${CODE[o]}`, () => true, { hcp: [11, 15] }, { tag: "minimum" })
];

// New suits at the two level: lower-ranking ones are natural, higher-ranking
// ones (reverses) promise 17+.
function twoLevelSuits(ctx, o, skip) {
  const list = [];
  [SPADES, HEARTS, DIAMONDS, 0].forEach((s) => {
    const call = bidCall(2, s);
    if (s === o || skip.includes(s) || !ctx.legal.has(call)) return;
    const len = { [s]: [4, 13] };
    if (s < o) {
      list.push(
        E(call, (h) => h.len[s] >= 4 && h.hcp <= 18, { len, hcp: [11, 18] })
      );
    } else {
      list.push(
        E(
          call,
          (h) => h.len[s] >= 4 && h.hcp >= 17 && h.len[o] > h.len[s],
          { len, hcp: [17, 23] },
          { forcing: true, tag: "reverse" }
        )
      );
    }
  });
  return list;
}

function supportRebids(r) {
  const c = CODE[r];
  const len = { [r]: [4, 13] };
  return [
    E(
      `4${c}`,
      (h) => h.len[r] >= 4 && h.total(r) >= 19,
      { len, hcp: [18, 21] },
      SIGNOFF
    ),
    E(
      `3${c}`,
      (h) => h.len[r] >= 4 && h.total(r) >= 16,
      { len, hcp: [15, 17] },
      {
        tag: "invite"
      }
    ),
    E(`2${c}`, (h) => h.len[r] >= 4, { len, hcp: [11, 15] }, { tag: "raise" })
  ];
}

function afterOneLevel(ctx, o, r) {
  const c = CODE[o];
  const oneLevel = [HEARTS, SPADES]
    .filter((s) => s > r && s !== o)
    .map((s) =>
      E(`1${CODE[s]}`, (h) => h.len[s] >= 4, {
        len: { [s]: [4, 13] },
        hcp: [11, 18]
      })
    );
  return [
    ...(isMajor(r) ? supportRebids(r) : []),
    ...oneLevel,
    E("1N", (h) => h.balanced && h.hcp <= 14, { hcp: [11, 14], bal: true }),
    E(
      "2N",
      (h) => h.balanced && h.hcp >= 18,
      { hcp: [18, 19], bal: true },
      {
        tag: "invite"
      }
    ),
    E(
      `3${c}`,
      (h) => h.len[o] >= 6 && h.pts >= 16,
      { len: { [o]: [6, 13] }, hcp: [15, 18] },
      {
        tag: "invite"
      }
    ),
    E(`2${c}`, (h) => h.len[o] >= 6, { len: { [o]: [6, 13] }, hcp: [11, 15] }),
    ...(isMajor(r) ? [] : supportRebids(r).slice(2)),
    ...twoLevelSuits(ctx, o, [r]),
    E(`2${c}`, () => true, { len: { [o]: [5, 13] } })
  ];
}

function afterOneNt(ctx, o, level) {
  const c = CODE[o];
  if (level === 2) {
    return [
      E("3N", (h) => h.hcp >= 13, {}, SIGNOFF),
      E(`3${c}`, (h) => h.len[o] >= 6 && !h.balanced),
      E("P", () => true)
    ];
  }
  if (level !== 1) return [E("P", () => true)];
  return [
    E(
      "2N",
      (h) => h.balanced && h.hcp >= 18,
      { hcp: [18, 19], bal: true },
      {
        tag: "invite"
      }
    ),
    E(
      `3${c}`,
      (h) => h.len[o] >= 6 && h.pts >= 16,
      { len: { [o]: [6, 13] } },
      {
        tag: "invite"
      }
    ),
    E(`2${c}`, (h) => h.len[o] >= 6, { len: { [o]: [6, 13] } }),
    ...twoLevelSuits(ctx, o, []).map((e) => ({
      ...e,
      test: (h) => !h.balanced && e.test(h)
    })),
    E("P", () => true)
  ];
}

function afterTwoOverOne(ctx, o, r) {
  const own = ctx.cheapest(o);
  const raise = ctx.cheapest(r);
  const need = isMajor(r) ? 3 : 4;
  const newSuits = [SPADES, HEARTS, DIAMONDS]
    .filter((s) => s !== o && s !== r && ctx.legal.has(bidCall(2, s)))
    .map((s) =>
      E(bidCall(2, s), (h) => h.len[s] >= 4, { len: { [s]: [4, 13] } })
    );
  return [
    raise &&
      E(
        raise,
        (h) => h.len[r] >= need,
        { len: { [r]: [need, 13] } },
        { tag: "raise" }
      ),
    own && E(own, (h) => h.len[o] >= 6, { len: { [o]: [6, 13] } }),
    E("2N", (h) => h.balanced && h.hcp <= 14, { hcp: [11, 14], bal: true }),
    E("3N", (h) => h.balanced, { hcp: [15, 19], bal: true }, SIGNOFF),
    ...newSuits,
    own && E(own, () => true, { len: { [o]: [5, 13] } })
  ].filter(Boolean);
}

export function openerRebids(ctx) {
  const o = ctx.myLast.strain;
  const resp = ctx.partnerLast;
  if (resp.meta.conv === "fit2n") return fit2nAnswers(o);
  if (resp.strain === o) {
    return isMajor(o)
      ? majorRaiseRebids(o, resp.level)
      : minorRaiseRebids(o, resp.level);
  }
  if (resp.strain === NT) return afterOneNt(ctx, o, resp.level);
  if (resp.level === 1) return afterOneLevel(ctx, o, resp.strain);
  if (resp.level === 2 && resp.meta.forcing)
    return afterTwoOverOne(ctx, o, resp.strain);
  return [];
}
