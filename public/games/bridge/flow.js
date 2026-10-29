// Drives the deal on screen: robots' calls and cards (with a delay so the
// play can be followed), pauses on finished tricks, the human's calls and
// cards, undo, hint, claim, last trick, and the end of each deal.
import { claimHolds, findHint } from "./assist.js";
import { legalCalls } from "./auction.js";
import { bidFor } from "./bid-system.js";
import { SOUTH } from "./cards.js";
import {
  closeDeal,
  currentDeal,
  dealResult,
  matchOver,
  redeal,
  replaceDeal
} from "./chicago.js";
import { dealState, humanControls, legalPlays, undoDeal } from "./deal.js";
import { canClaim, renderDeal } from "./flow-view.js";
import { playView } from "./robot-view.js";
import { sound } from "./sound.js";

const DELAYS = {
  slow: { bid: 900, card: 1000, trick: 1500 },
  normal: { bid: 550, card: 650, trick: 1000 },
  fast: { bid: 200, card: 250, trick: 500 }
};

export function createFlow(ctx) {
  const fs = {
    match: null,
    epoch: 0,
    timer: 0,
    lastTimer: 0,
    pause: false,
    showLast: false,
    thinking: null,
    hint: null,
    message: "",
    selectedCall: null,
    showAuction: false
  };
  const delays = () => DELAYS[ctx.settings().speed] || DELAYS.normal;
  const deal = () => currentDeal(fs.match);
  const later = (ms, fn) => {
    const epoch = fs.epoch;
    clearTimeout(fs.timer);
    fs.timer = setTimeout(() => epoch === fs.epoch && fn(), ms);
  };

  function render() {
    if (!fs.match) return;
    const d = deal();
    renderDeal(fs, d, dealState(d), {
      t: ctx.t,
      lang: ctx.lang(),
      settings: ctx.settings(),
      bidBox: ctx.bidBox,
      onPlay: play,
      onSelectCall: (index) => {
        fs.selectedCall = fs.selectedCall === index ? null : index;
        render();
      }
    });
  }

  function commit(next) {
    fs.match = replaceDeal(fs.match, next);
    fs.hint = null;
    fs.message = "";
    fs.showAuction = false;
    ctx.save(fs.match);
  }

  function applyCall(call) {
    const d = deal();
    if (!legalCalls(d.dealer, d.calls).includes(call)) return;
    commit({ ...d, calls: [...d.calls, call] });
    sound.bid();
    step();
  }

  function applyCard(card) {
    const d = deal();
    const before = dealState(d);
    commit({ ...d, plays: [...d.plays, card] });
    sound.card();
    fs.thinking = null;
    if (before.current.plays.length === 3) {
      fs.pause = true;
      render();
      later(delays().trick, () => {
        fs.pause = false;
        sound.trick();
        step();
      });
      return;
    }
    step();
  }

  function robotTurn(state) {
    const d = deal();
    fs.thinking = state.toAct;
    render();
    if (state.phase === "auction") {
      return later(delays().bid, () =>
        applyCall(bidFor(d.hands[state.toAct], d.dealer, d.vul, d.calls).call)
      );
    }
    const epoch = fs.epoch;
    const started = Date.now();
    const level = fs.match.level;
    ctx.robot.card(playView(d, state, state.toAct, level)).then((card) => {
      if (epoch !== fs.epoch) return;
      later(Math.max(0, delays().card - (Date.now() - started)), () =>
        applyCard(card)
      );
    });
  }

  function humanTurn(state) {
    fs.thinking = null;
    render();
    if (state.phase !== "play" || ctx.settings().autoplay !== "on") return;
    const legal = legalPlays(state.remaining[state.toAct], state.current.plays);
    if (legal.length === 1) later(350, () => applyCard(legal[0]));
  }

  function step() {
    clearTimeout(fs.timer);
    fs.thinking = null;
    const state = dealState(deal());
    if (state.phase === "passed") {
      fs.message = ctx.t("passedOut");
      render();
      return later(1800, () => {
        fs.match = redeal(fs.match);
        fs.message = "";
        ctx.save(fs.match);
        step();
      });
    }
    if (state.phase === "done") {
      render();
      return ctx.onDealEnd(dealResult(deal()), fs.match);
    }
    if (humanControls(state, state.toAct)) return humanTurn(state);
    robotTurn(state);
  }

  function play(card) {
    const state = dealState(deal());
    if (
      state.phase !== "play" ||
      fs.pause ||
      !humanControls(state, state.toAct)
    )
      return;
    if (
      !legalPlays(state.remaining[state.toAct], state.current.plays).includes(
        card
      )
    )
      return;
    fs.epoch += 1;
    applyCard(card);
  }

  function call(value) {
    const state = dealState(deal());
    if (state.phase !== "auction" || state.toAct !== SOUTH) return;
    fs.epoch += 1;
    applyCall(value);
  }

  function undo() {
    const previous = undoDeal(deal());
    if (!previous || dealState(deal()).phase === "done") return;
    ctx.robot.reset();
    fs.epoch += 1;
    fs.pause = false;
    commit(previous);
    step();
  }

  async function hint() {
    const d = deal();
    const state = dealState(d);
    const open = state.phase === "auction" || state.phase === "play";
    if (!open || !humanControls(state, state.toAct) || fs.pause) return;
    const epoch = fs.epoch;
    const found = await findHint(d, state, { ...ctx, lang: ctx.lang() });
    if (epoch !== fs.epoch) return;
    Object.assign(fs, found);
    render();
  }

  async function claim() {
    const d = deal();
    const state = dealState(d);
    if (!canClaim(state) || fs.pause) return;
    const epoch = fs.epoch;
    fs.message = ctx.t("checking");
    render();
    const holds = await claimHolds(state, ctx.robot);
    if (epoch !== fs.epoch) return;
    if (!holds) {
      fs.message = ctx.t("claimRefused");
      return render();
    }
    fs.epoch += 1;
    commit({ ...d, claim: 13 - state.tricks.length });
    fs.message = ctx.t("claimAccepted");
    step();
  }

  function lastTrick() {
    clearTimeout(fs.lastTimer);
    fs.showLast = !fs.showLast;
    render();
    if (fs.showLast) {
      fs.lastTimer = setTimeout(() => {
        fs.showLast = false;
        render();
      }, 2500);
    }
  }

  // During the play the contract in the status line brings the auction back.
  function toggleAuction() {
    if (!fs.match || dealState(deal()).phase !== "play") return;
    fs.showAuction = !fs.showAuction;
    render();
  }

  // After the result of a deal: score it, then the next deal or the end.
  function next() {
    fs.match = closeDeal(fs.match);
    ctx.save(fs.match);
    if (matchOver(fs.match)) return ctx.onMatchEnd(fs.match);
    fs.selectedCall = null;
    step();
  }

  function mount(match, auction = false) {
    unmount();
    fs.match = match;
    fs.showAuction = auction && dealState(deal()).phase === "play";
    step();
  }

  function unmount() {
    fs.epoch += 1;
    clearTimeout(fs.timer);
    clearTimeout(fs.lastTimer);
    ctx.robot.reset();
    Object.assign(fs, {
      match: null,
      pause: false,
      showLast: false,
      showAuction: false,
      hint: null,
      message: "",
      selectedCall: null
    });
  }

  return {
    mount,
    unmount,
    render,
    call,
    undo,
    hint,
    claim,
    lastTrick,
    toggleAuction,
    next,
    match: () => fs.match,
    auctionShown: () => fs.showAuction
  };
}
