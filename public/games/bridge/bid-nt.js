// Notrump sequences after 1SA (15–17), 2SA (20–21), 2♣-2♦-2SA (22–23) and
// 2♦-2♥-2SA (24+): Stayman, Texas (transfers) to the majors, invitations,
// quantitative 4SA, and the opener's answers to each.
import { bidCall } from "./auction.js";
import { entry as E } from "./bid-context.js";
import { HEARTS, SPADES } from "./cards.js";

const CODE = "CDHS";

function strength(level, [low, high], gf) {
  const game = (h) =>
    gf || h.hcp + low >= 25 || (level >= 2 && h.hcp + high >= 25);
  const invite = (h) => level === 1 && h.hcp + high >= 25;
  return { game, invite };
}

function transfers(level, nt) {
  const L = level + 1;
  return [
    E(
      `${L}H`,
      (h) => h.len[SPADES] >= 5 && h.len[SPADES] >= h.len[HEARTS],
      { len: { [SPADES]: [5, 13] } },
      {
        conv: "texas",
        forcing: true,
        tag: "transferSpades",
        target: SPADES,
        nt
      }
    ),
    E(
      `${L}D`,
      (h) => h.len[HEARTS] >= 5,
      { len: { [HEARTS]: [5, 13] } },
      {
        conv: "texas",
        forcing: true,
        tag: "transferHearts",
        target: HEARTS,
        nt
      }
    )
  ];
}

function quantitative(range, nt) {
  const low = range[0];
  return [
    E(
      "7N",
      (h) => h.hcp + low >= 37,
      { hcp: [37 - low, 37] },
      { signoff: true }
    ),
    E(
      "6N",
      (h) => h.hcp + low >= 33,
      { hcp: [33 - low, 36 - low] },
      {
        signoff: true
      }
    ),
    E(
      "4N",
      (h) => h.hcp + low >= 31,
      { hcp: [31 - low, 32 - low] },
      { conv: "quant", tag: "quantitative", nt }
    )
  ];
}

export function ntResponses(level, range, gf = false) {
  const nt = { level, range };
  const { game, invite } = strength(level, range, gf);
  const fourMajor = (h) => h.len[HEARTS] === 4 || h.len[SPADES] === 4;
  return [
    ...transfers(level, nt),
    E(
      `${level + 1}C`,
      (h) => (game(h) || invite(h)) && fourMajor(h),
      { hcp: [Math.max(0, 25 - range[1]), 37] },
      { conv: "stayman", forcing: true, tag: "stayman", nt }
    ),
    ...quantitative(range, nt),
    E(
      "3N",
      game,
      { hcp: [Math.max(0, 25 - range[1]), 30 - range[0]] },
      {
        signoff: true
      }
    ),
    level === 1 &&
      E("2N", invite, { hcp: [8, 9] }, { conv: "ntInvite", tag: "invite", nt }),
    !gf && E("P", () => true, { hcp: [0, 24 - range[1]] })
  ].filter(Boolean);
}

export function staymanAnswers(level) {
  const L = level + 1;
  return [
    E(
      `${L}H`,
      (h) => h.len[HEARTS] >= 4,
      { len: { [HEARTS]: [4, 5] } },
      {
        tag: "fourHearts"
      }
    ),
    E(
      `${L}S`,
      (h) => h.len[SPADES] >= 4,
      { len: { [SPADES]: [4, 5], [HEARTS]: [0, 3] } },
      { tag: "fourSpades" }
    ),
    E(
      `${L}D`,
      () => true,
      { len: { [HEARTS]: [0, 3], [SPADES]: [0, 3] } },
      { tag: "noMajor" }
    )
  ];
}

export const texasAnswer = ({ nt, target }) => [
  E(
    bidCall(nt.level + 1, target),
    () => true,
    { len: { [target]: [2, 5] } },
    {
      tag: "completion"
    }
  )
];

// Responder's second call after Stayman: fit → majors, else notrump.
export function staymanFollowUps(myMeta, answer) {
  const { nt } = myMeta;
  const { game, invite } = strength(nt.level, nt.range);
  const list = [];
  if (answer.strain === HEARTS || answer.strain === SPADES) {
    const m = answer.strain;
    const len = { [m]: [4, 5] };
    list.push(
      E(
        `4${CODE[m]}`,
        (h) => h.len[m] >= 4 && game(h),
        { len },
        { signoff: true }
      )
    );
    if (nt.level === 1) {
      list.push(
        E(
          `3${CODE[m]}`,
          (h) => h.len[m] >= 4 && invite(h),
          { len },
          {
            conv: "majorInvite",
            tag: "invite",
            target: m,
            nt
          }
        )
      );
    }
  }
  list.push(E("3N", game, {}, { conv: "staymanGame", tag: "toPlay", nt }));
  if (nt.level === 1) {
    list.push(E("2N", invite, {}, { conv: "ntInvite", tag: "invite", nt }));
  }
  list.push(E("P", () => true));
  return list;
}

// Responder's second call after the transfer was completed.
export function texasFollowUps({ nt, target }) {
  const { game, invite } = strength(nt.level, nt.range);
  const c = CODE[target];
  const t = target;
  return [
    E(
      `4${c}`,
      (h) => h.len[t] >= 6 && game(h),
      { len: { [t]: [6, 13] } },
      {
        signoff: true
      }
    ),
    E(
      "3N",
      (h) => h.len[t] === 5 && game(h),
      { len: { [t]: [5, 5] } },
      {
        conv: "texasChoice",
        tag: "choice",
        target: t,
        nt
      }
    ),
    nt.level === 1 &&
      E(
        `3${c}`,
        (h) => h.len[t] >= 6 && invite(h),
        { len: { [t]: [6, 13] } },
        {
          conv: "majorInvite",
          tag: "invite",
          target: t,
          nt
        }
      ),
    nt.level === 1 &&
      E(
        "2N",
        invite,
        { len: { [t]: [5, 5] } },
        {
          conv: "texasInvite",
          tag: "invite",
          target: t,
          nt
        }
      ),
    E("P", () => true, { hcp: [0, 24 - nt.range[1]] })
  ].filter(Boolean);
}

// Opener's answer to an invitation, a choice of games or a quantitative 4SA.
export function ntOpenerAnswers(partnerMeta, myMeta) {
  const { conv, target, nt } = partnerMeta;
  const max = (h) => h.hcp > nt.range[0];
  const showedHearts = myMeta?.tag === "fourHearts";
  const spades = (h) => showedHearts && h.len[SPADES] >= 4;
  const c = CODE[target];
  const answers = {
    ntInvite: [
      E("4S", (h) => spades(h) && max(h), {}, { signoff: true }),
      E("3S", spades, { len: { [SPADES]: [4, 4] } }),
      E("3N", max, { hcp: [nt.range[0] + 1, nt.range[1]] }, { signoff: true })
    ],
    staymanGame: [E("4S", spades, {}, { signoff: true })],
    majorInvite: [E(`4${c}`, max, {}, { signoff: true })],
    texasChoice: [E(`4${c}`, (h) => h.len[target] >= 3, {}, { signoff: true })],
    texasInvite: [
      E(`4${c}`, (h) => max(h) && h.len[target] >= 3, {}, { signoff: true }),
      E("3N", max, {}, { signoff: true }),
      E(`3${c}`, (h) => h.len[target] >= 3)
    ],
    quant: [E("6N", max, {}, { signoff: true })]
  };
  return [...(answers[conv] || []), E("P", () => true)];
}

const NT_CONVS = [
  "ntInvite",
  "staymanGame",
  "majorInvite",
  "texasChoice",
  "texasInvite",
  "quant"
];

export const isNtConv = (meta) => NT_CONVS.includes(meta?.conv);
