// Help on the human's turn: a hint (the call or card the robots would
// choose in South's place) and the claim check (double dummy on the cards
// left: the claim stands only if no defence can take a trick).
import { bidFor } from "./bid-system.js";
import { sideOf, SOUTH } from "./cards.js";
import { callLabel, cardLabel, explainText } from "./i18n.js";
import { playView } from "./robot-view.js";

// → { hint, message } for the deal on screen.
export async function findHint(deal, state, { robot, t, lang }) {
  if (state.phase === "auction") {
    const { call, meta } = bidFor(
      deal.hands[SOUTH],
      deal.dealer,
      deal.vul,
      deal.calls
    );
    const meaning = explainText(lang, meta);
    return {
      hint: call,
      message: t("hintBid", { call: callLabel(lang, call), meaning })
    };
  }
  const card = await robot.card(playView(deal, state, state.toAct, "hint"));
  return {
    hint: card,
    message: t("hintCard", { card: cardLabel(lang, card) })
  };
}

export async function claimHolds(state, robot) {
  const value = await robot.claim({
    hands: state.remaining,
    trick: state.current.plays,
    leader: state.current.leader,
    trump: state.trump,
    maxSide: sideOf(SOUTH)
  });
  return value === 13 - state.tricks.length;
}
