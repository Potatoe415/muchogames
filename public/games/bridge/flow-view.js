// Builds the view model of the deal on screen and renders the table, the
// auction, the bidding box, the action buttons and the prompt line.
import { renderAuction } from "./auction-view.js";
import { legalCalls } from "./auction.js";
import { analyzeAuction } from "./bid-system.js";
import { NORTH, SOUTH, sideOf } from "./cards.js";
import { humanControls, legalPlays, undoDeal } from "./deal.js";
import { seatName } from "./i18n.js";
import { renderTable } from "./table-view.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function trickOnTable(fs, state) {
  if (state.phase !== "play" && state.phase !== "done") return {};
  if (state.current?.plays.length) return { plays: state.current.plays };
  const last = state.tricks[state.tricks.length - 1];
  if (!last || !(fs.pause || fs.showLast)) return {};
  return {
    plays: last.plays,
    winner: last.winner,
    last: fs.showLast && !fs.pause
  };
}

function prompt(fs, state, t, lang) {
  if (fs.message) return fs.message;
  if (state.phase !== "auction" && state.phase !== "play") return "";
  const seat = state.toAct;
  if (!humanControls(state, seat)) {
    const thinker = seat === state.dummy ? state.contract.declarer : seat;
    return t("thinking", { seat: seatName(lang, thinker) });
  }
  if (state.phase === "auction") return t("yourBid");
  return seat === state.dummy
    ? t("dummyCard", { seat: seatName(lang, seat) })
    : t("yourCard");
}

function humanPlayable(fs, deal, state) {
  if (state.phase !== "play" || fs.pause || !humanControls(state, state.toAct))
    return null;
  return new Set(legalPlays(state.remaining[state.toAct], state.current.plays));
}

export function canClaim(state) {
  return (
    state.phase === "play" &&
    sideOf(state.contract.declarer) === sideOf(SOUTH) &&
    humanControls(state, state.toAct) &&
    13 - state.tricks.length <= 7
  );
}

function renderActions(fs, deal, state, settings) {
  const humanTurn =
    (state.phase === "auction" || state.phase === "play") &&
    humanControls(state, state.toAct) &&
    !fs.pause;
  $("bridge-undo-button").disabled = state.phase === "done" || !undoDeal(deal);
  $("bridge-hint-button").hidden = settings.hints !== "on";
  $("bridge-hint-button").disabled = !humanTurn;
  $("bridge-last-trick-button").disabled = !state.tricks?.length;
  $("bridge-claim-button").hidden = !canClaim(state) || fs.pause;
}

export function renderDeal(fs, deal, state, ctx) {
  const { t, lang, settings, bidBox } = ctx;
  const metas = analyzeAuction(deal.dealer, deal.vul, deal.calls).metas;
  const trick = trickOnTable(fs, state);
  const m = {
    deal,
    state,
    t,
    lang,
    metas,
    dealNumber: fs.match.results.length + 1,
    trump: state.trump ?? -1,
    openHands: settings.openHands === "on",
    playable: humanPlayable(fs, deal, state),
    hint: typeof fs.hint === "number" ? fs.hint : null,
    thinking: fs.thinking,
    trickPlays: trick.plays,
    trickWinner: trick.winner,
    lastTrick: trick.last,
    onPlay: ctx.onPlay,
    selectedCall: fs.selectedCall,
    showAuction: fs.showAuction,
    onSelectCall: ctx.onSelectCall
  };
  renderTable(m);
  renderAuction($("bridge-auction"), m);
  const auction = state.phase === "auction";
  $("bridge-bidding-box").hidden = !auction;
  const humanBid = auction && state.toAct === SOUTH;
  bidBox.update(
    humanBid ? legalCalls(deal.dealer, deal.calls) : [],
    humanBid ? fs.hint : null,
    `${fs.match.results.length}:${deal.calls.length}`
  );
  renderActions(fs, deal, state, settings);
  $("bridge-message").textContent = prompt(fs, state, t, lang);
  $("bridge-stage").dataset.phase = state.phase;
  $("bridge-stage").dataset.declarer = state.contract
    ? state.contract.declarer === NORTH
      ? "north"
      : "other"
    : "";
}
