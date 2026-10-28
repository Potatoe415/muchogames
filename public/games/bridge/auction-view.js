// The auction grid (West, North, East, South columns, like a bridge diagram).
// Every call is a button: tapping it shows what it means.
import { parseBid, seatOfCall } from "./auction.js";
import { EAST, NORTH, SOUTH, WEST } from "./cards.js";
import {
  callLabel,
  explainText,
  seatLetter,
  seatName,
  strainLabel
} from "./i18n.js";

const ORDER = [WEST, NORTH, EAST, SOUTH];

// A call with its suit symbol coloured like the cards.
export function callNode(lang, call, tag = "span") {
  const el = document.createElement(tag);
  const bid = parseBid(call);
  if (!bid) {
    el.textContent = callLabel(lang, call, true);
    el.className = `br-call-label br-call-${call.toLowerCase()}`;
    return el;
  }
  el.className = "br-call-label";
  const symbol = document.createElement("span");
  symbol.className = bid.strain < 4 ? `suit-${bid.strain}` : "br-nt";
  symbol.textContent = strainLabel(lang, bid.strain);
  el.append(String(bid.level), symbol);
  return el;
}

function headerRow(grid, deal, lang) {
  ORDER.forEach((seat) => {
    const head = document.createElement("span");
    head.className = "br-auction-head";
    head.classList.toggle("is-vul", Boolean(deal.vul[seat % 2]));
    head.textContent = seatLetter(lang, seat);
    grid.append(head);
  });
}

export function renderAuction(host, m) {
  const { deal, lang } = m;
  host.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "br-auction-grid";
  headerRow(grid, deal, lang);
  for (let i = 0; i < ORDER.indexOf(deal.dealer); i += 1) {
    grid.append(document.createElement("span"));
  }
  deal.calls.forEach((call, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "br-auction-call";
    button.dataset.id = `bridge-auction-call-${index + 1}`;
    button.classList.toggle("is-selected", m.selectedCall === index);
    button.append(callNode(lang, call));
    button.addEventListener("click", () => m.onSelectCall(index));
    grid.append(button);
  });
  if (m.state.phase === "auction") {
    const next = document.createElement("span");
    next.className = "br-auction-next";
    next.textContent = "?";
    grid.append(next);
  }
  host.append(grid, explanation(m));
}

function explanation(m) {
  const line = document.createElement("p");
  line.className = "br-explain";
  line.dataset.id = "bridge-bid-explain";
  const index = m.selectedCall;
  if (index === null || index === undefined || !m.metas[index]) {
    line.textContent = m.deal.calls.length ? m.t("tapBid") : "";
    return line;
  }
  const call = m.deal.calls[index];
  line.textContent = m.t("explainLine", {
    seat: seatName(m.lang, seatOfCall(m.deal.dealer, index)),
    call: callLabel(m.lang, call),
    meaning: explainText(m.lang, m.metas[index])
  });
  return line;
}
