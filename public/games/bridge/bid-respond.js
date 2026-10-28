// Responder's first call after partner's one-of-a-suit opening, when the
// opponents stay silent. Major fit first, then new suits, then notrump.
import { entry as E } from "./bid-context.js";
import { between, CLUBS, DIAMONDS, HEARTS, SPADES } from "./cards.js";

const CODE = "CDHS";
const noMajor = (h) => h.len[HEARTS] < 4 && h.len[SPADES] < 4;
const NO_MAJOR_LEN = { [HEARTS]: [0, 3], [SPADES]: [0, 3] };
const FORCING = { forcing: true };

function majorRaises(m) {
  const c = CODE[m];
  const fourSpades = (h) => m === HEARTS && h.len[SPADES] >= 4;
  return [
    E(
      "2N",
      (h) => h.len[m] >= 4 && h.dummy(m) >= 13,
      { hcp: [11, 37], len: { [m]: [4, 13] } },
      { conv: "fit2n", forcing: true, gf: true, tag: "fitGameForcing" }
    ),
    E(
      `4${c}`,
      (h) => h.len[m] >= 5 && h.hcp <= 9 && h.short(m) >= 2,
      { hcp: [0, 9], len: { [m]: [5, 13] } },
      { tag: "preemptRaise" }
    ),
    E(
      `3${c}`,
      (h) =>
        between(h.dummy(m), 11, 12) &&
        (h.len[m] >= 4 || (h.len[m] === 3 && !fourSpades(h))),
      { hcp: [10, 12], len: { [m]: [3, 13] } },
      { tag: "limitRaise" }
    ),
    E(
      `2${c}`,
      (h) => h.len[m] >= 3 && between(h.dummy(m), 6, 10),
      { hcp: [5, 10], len: { [m]: [3, 13] } },
      { tag: "raise" }
    )
  ];
}

function majorNewSuits(m) {
  const minorTwo = (h) =>
    h.len[DIAMONDS] >= 4 &&
    h.len[DIAMONDS] >= h.len[CLUBS] &&
    !(h.len[DIAMONDS] === 4 && h.len[CLUBS] === 4);
  return [
    m === HEARTS
      ? E(
          "1S",
          (h) => h.len[SPADES] >= 4 && h.hcp >= 6,
          { hcp: [6, 37], len: { [SPADES]: [4, 13] } },
          FORCING
        )
      : E(
          "2H",
          (h) => h.len[HEARTS] >= 5 && h.hcp >= 11,
          { hcp: [11, 37], len: { [HEARTS]: [5, 13] } },
          FORCING
        ),
    E(
      "2D",
      (h) => h.hcp >= 11 && minorTwo(h),
      { hcp: [11, 37], len: { [DIAMONDS]: [4, 13] } },
      FORCING
    ),
    E(
      "2C",
      (h) => h.hcp >= 11 && h.len[CLUBS] >= 3,
      { hcp: [11, 37], len: { [CLUBS]: [3, 13] } },
      FORCING
    )
  ];
}

function majorResponses(m) {
  const denies = { [m]: [0, 2] };
  if (m === HEARTS) denies[SPADES] = [0, 3];
  return [
    ...majorRaises(m),
    ...majorNewSuits(m),
    E("1N", (h) => between(h.hcp, 6, 10), { hcp: [6, 10], len: denies }),
    E("P", () => true, { hcp: [0, 5] })
  ];
}

function minorNewSuits(m) {
  const diamonds = (h) =>
    h.hcp >= 6 &&
    h.len[DIAMONDS] >= 4 &&
    (noMajor(h) ||
      (h.hcp >= 11 &&
        h.len[DIAMONDS] >= 5 &&
        h.len[DIAMONDS] > Math.max(h.len[HEARTS], h.len[SPADES])));
  const hearts = (h) =>
    h.len[HEARTS] > h.len[SPADES] ||
    (h.len[HEARTS] === 4 && h.len[SPADES] === 4);
  return [
    m === CLUBS &&
      E(
        "1D",
        diamonds,
        { hcp: [6, 37], len: { [DIAMONDS]: [4, 13] } },
        FORCING
      ),
    E(
      "1H",
      (h) => h.hcp >= 6 && h.len[HEARTS] >= 4 && hearts(h),
      { hcp: [6, 37], len: { [HEARTS]: [4, 13] } },
      FORCING
    ),
    E(
      "1S",
      (h) => h.hcp >= 6 && h.len[SPADES] >= 4,
      { hcp: [6, 37], len: { [SPADES]: [4, 13] } },
      FORCING
    ),
    m === DIAMONDS &&
      E(
        "2C",
        (h) => h.hcp >= 11 && h.len[CLUBS] >= 5,
        { hcp: [11, 37], len: { [CLUBS]: [5, 13] } },
        FORCING
      )
  ].filter(Boolean);
}

function minorLimitBids(m) {
  const c = CODE[m];
  const support = (h) => h.len[m] >= (m === DIAMONDS ? 4 : 5) && noMajor(h);
  const supportLen = { [m]: [4, 13], ...NO_MAJOR_LEN };
  return [
    E("3N", (h) => h.balanced && between(h.hcp, 13, 15) && noMajor(h), {
      hcp: [13, 15],
      bal: true,
      len: NO_MAJOR_LEN
    }),
    E(
      "2N",
      (h) => h.balanced && between(h.hcp, 11, 12) && noMajor(h),
      { hcp: [11, 12], bal: true, len: NO_MAJOR_LEN },
      { tag: "invite" }
    ),
    E(
      `3${c}`,
      (h) => support(h) && between(h.hcp, 11, 12),
      { hcp: [11, 12], len: supportLen },
      { tag: "limitRaise" }
    ),
    E(
      `2${c}`,
      (h) => support(h) && between(h.hcp, 6, 10),
      { hcp: [6, 10], len: supportLen },
      { tag: "raise" }
    ),
    E("1N", (h) => between(h.hcp, 6, 10) && noMajor(h), {
      hcp: [6, 10],
      len: NO_MAJOR_LEN
    })
  ];
}

// Strong hands that fit nothing above still bid a forcing new suit.
const minorFallback = (m) =>
  m === DIAMONDS
    ? E(
        "2C",
        (h) => h.hcp >= 11 && h.len[CLUBS] >= 3,
        { hcp: [11, 37] },
        FORCING
      )
    : E(
        "1D",
        (h) => h.hcp >= 11 && h.len[DIAMONDS] >= 3,
        { hcp: [6, 37] },
        FORCING
      );

export function oneSuitResponses(strain) {
  if (strain === HEARTS || strain === SPADES) return majorResponses(strain);
  return [
    ...minorNewSuits(strain),
    ...minorLimitBids(strain),
    minorFallback(strain),
    E("P", () => true, { hcp: [0, 5] })
  ];
}
