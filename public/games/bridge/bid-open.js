// Openings, French standard (SEF, five-card majors): 1♣/1♦ best minor,
// 1♥/1♠ five cards, 1SA 15–17, 2SA 20–21, 2♣ strong, 2♦ game forcing,
// 2♥/2♠ weak, three- and four-level preempts.
import { entry as E } from "./bid-context.js";
import { between, CLUBS, DIAMONDS, HEARTS, SPADES } from "./cards.js";

const OTHER_MAJOR = { [HEARTS]: SPADES, [SPADES]: HEARTS };
const CODE = "CDHS";

function opensDiamond(h) {
  const d = h.len[DIAMONDS];
  const c = h.len[CLUBS];
  return d > c || (d === c && d >= 4);
}

function strongOpenings() {
  return [
    E(
      "2D",
      (h) => h.hcp >= 24 || (h.hcp >= 21 && h.pts >= 26),
      { hcp: [21, 37] },
      { conv: "gf2d", forcing: true, gf: true, tag: "gameForcing" }
    ),
    E("2N", (h) => h.balanced && between(h.hcp, 20, 21), {
      hcp: [20, 21],
      bal: true
    }),
    E(
      "2C",
      (h) =>
        (h.balanced && between(h.hcp, 22, 23)) ||
        (!h.balanced && h.hcp >= 19 && h.pts >= 23),
      { hcp: [19, 23] },
      { conv: "strong2c", forcing: true, tag: "strong" }
    ),
    E("1N", (h) => h.balanced && between(h.hcp, 15, 17), {
      hcp: [15, 17],
      bal: true
    })
  ];
}

function oneLevelOpenings(canOpen) {
  const range = [11, 23];
  return [
    E(
      "1S",
      (h) => canOpen(h) && h.len[SPADES] >= 5 && h.len[SPADES] >= h.len[HEARTS],
      { hcp: range, len: { [SPADES]: [5, 13] } }
    ),
    E("1H", (h) => canOpen(h) && h.len[HEARTS] >= 5, {
      hcp: range,
      len: { [HEARTS]: [5, 13] }
    }),
    E("1D", (h) => canOpen(h) && opensDiamond(h), {
      hcp: range,
      len: { [DIAMONDS]: [3, 13], [HEARTS]: [0, 4], [SPADES]: [0, 4] }
    }),
    E("1C", canOpen, {
      hcp: range,
      len: { [CLUBS]: [3, 13], [HEARTS]: [0, 4], [SPADES]: [0, 4] }
    })
  ];
}

function preempts() {
  const list = [];
  [SPADES, HEARTS].forEach((suit) => {
    list.push(
      E(
        `4${CODE[suit]}`,
        (h) => h.len[suit] >= 8 && between(h.hcp, 5, 11),
        { hcp: [5, 11], len: { [suit]: [8, 13] }, bonus: 4 },
        { tag: "preempt" }
      )
    );
  });
  [SPADES, HEARTS, DIAMONDS, CLUBS].forEach((suit) => {
    list.push(
      E(
        `3${CODE[suit]}`,
        (h) => h.len[suit] >= 7 && between(h.hcp, 5, 10) && h.q[suit] >= 2,
        { hcp: [5, 10], len: { [suit]: [7, 13] }, bonus: 3 },
        { tag: "preempt" }
      )
    );
  });
  [SPADES, HEARTS].forEach((suit) => {
    const weak = (h) =>
      h.len[suit] === 6 &&
      between(h.hcp, 6, 10) &&
      h.q[suit] >= 2 &&
      h.len[OTHER_MAJOR[suit]] < 4;
    list.push(
      E(
        `2${CODE[suit]}`,
        weak,
        { hcp: [6, 10], len: { [suit]: [6, 6] }, bonus: 2 },
        { tag: "weakTwo" }
      )
    );
  });
  return list;
}

export function openingEntries(ctx) {
  const fourthSeat = ctx.calls.length === 3;
  // Rule of 20 for light openings; in fourth seat also the rule of 15.
  const canOpen = (h) =>
    (h.hcp >= 12 || (h.hcp >= 11 && h.rule20)) &&
    (!fourthSeat || h.hcp + h.len[SPADES] >= 15);
  return [
    ...strongOpenings(),
    ...oneLevelOpenings(canOpen),
    ...(fourthSeat ? [] : preempts()),
    E("P", () => true, { hcp: fourthSeat ? [0, 14] : [0, 11] })
  ];
}
