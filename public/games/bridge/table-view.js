// The table: status line, the four seats (name, dealer, vulnerability, role,
// cards) and the trick in the middle. Pure rendering from a view model built
// by flow.js.
import { NORTH, sideOf, SOUTH } from "./cards.js";
import { humanControls } from "./deal.js";
import { renderBacks, renderFan, renderLines, cardFace } from "./hand-view.js";
import { contractLabel, seatLetter, seatName } from "./i18n.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const seatNode = (seat) =>
  document.querySelector(`.br-table [data-seat="${seat}"]`);

function vulText(m) {
  const [ns, ew] = m.deal.vul;
  return m.t(ns && ew ? "vulAll" : ns ? "vulNs" : ew ? "vulEw" : "vulNone");
}

function renderStatus(m) {
  const { state, deal } = m;
  $("bridge-status-deal").textContent =
    `${m.t("dealOf", { n: m.dealNumber })} · ${vulText(m)}`;
  const contract = state.contract;
  $("bridge-status-contract").textContent = contract
    ? `${contractLabel(m.lang, contract)} ${seatLetter(m.lang, contract.declarer)}`
    : m.t("dealerIs", { seat: seatName(m.lang, deal.dealer) });
  $("bridge-status-tricks").textContent = state.won
    ? m.t("tricksLine", { ns: state.won[0], ew: state.won[1] })
    : "";
}

function seatTitle(m, seat) {
  if (seat === SOUTH) return m.t("you");
  if (seat === NORTH) return `${m.t("partner")} · ${seatName(m.lang, seat)}`;
  return seatName(m.lang, seat);
}

function badge(text, kind) {
  const el = document.createElement("span");
  el.className = `br-badge br-badge-${kind}`;
  el.textContent = text;
  return el;
}

function renderTag(m, seat, tag) {
  const { state, deal } = m;
  tag.replaceChildren();
  const name = document.createElement("strong");
  name.textContent = seatTitle(m, seat);
  tag.append(name);
  if (deal.dealer === seat) tag.append(badge(m.t("dealerShort"), "dealer"));
  if (state.contract && state.contract.declarer === seat) {
    tag.append(badge(m.t("declarerBadge"), "role"));
  }
  if (state.contract && state.dummy === seat)
    tag.append(badge(m.t("dummyBadge"), "role"));
  if (m.thinking === seat) tag.append(badge("…", "thinking"));
  tag.classList.toggle("is-vul", Boolean(deal.vul[sideOf(seat)]));
  const active = state.phase === "auction" || state.phase === "play";
  tag.classList.toggle("is-turn", active && state.toAct === seat);
}

function seatCards(m, seat) {
  const { state, deal } = m;
  return state.phase === "play" ? state.remaining[seat] : deal.hands[seat];
}

function isVisible(m, seat) {
  const { state } = m;
  if (seat === SOUTH || m.openHands) return true;
  if (state.phase !== "play") return state.phase === "done";
  if (seat === state.dummy && state.dummyVisible) return true;
  return humanControls(state, seat);
}

function renderSeat(m, seat) {
  const node = seatNode(seat);
  renderTag(m, seat, node.querySelector("[data-seat-tag]"));
  const host = node.querySelector("[data-seat-hand]");
  const cards = seatCards(m, seat);
  if (!isVisible(m, seat)) return renderBacks(host, cards.length);
  if (sideOf(seat) === 1) return renderLines(host, cards, m);
  const turn = m.playable && m.state.toAct === seat;
  renderFan(host, cards, {
    lang: m.lang,
    trump: m.trump,
    playable: turn ? m.playable : null,
    hint: m.hint,
    onPlay: m.onPlay
  });
}

function renderTrick(m) {
  const center = $("bridge-center");
  const auction = m.state.phase === "auction" || m.state.phase === "passed";
  center.classList.toggle("is-auction", auction || m.showAuction);
  document
    .querySelectorAll(".br-slot")
    .forEach((slot) => slot.replaceChildren());
  $("bridge-trick").classList.toggle("is-last", Boolean(m.lastTrick));
  (m.trickPlays || []).forEach(({ seat, card }) => {
    const face = cardFace(card, m.lang);
    if (seat === m.trickWinner) face.classList.add("is-winner");
    document.querySelector(`.br-slot[data-slot="${seat}"]`).append(face);
  });
}

export function renderTable(m) {
  renderStatus(m);
  [0, 1, 2, 3].forEach((seat) => renderSeat(m, seat));
  renderTrick(m);
}
