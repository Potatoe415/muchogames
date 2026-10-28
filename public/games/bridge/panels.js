// Overlays: the result of a deal, the four hands, the score sheet and the
// end of the match.
import { totals } from "./chicago.js";
import { renderLines } from "./hand-view.js";
import { contractLabel, seatLetter, seatName } from "./i18n.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function resultMark(result) {
  const diff = result.tricks - (result.contract.level + 6);
  return diff === 0 ? "=" : diff > 0 ? `+${diff}` : `−${-diff}`;
}

function resultWords(t, result) {
  const diff = result.tricks - (result.contract.level + 6);
  if (diff < 0) return t("down", { n: -diff });
  return diff ? `${t("made")} ${t("over", { n: diff })}` : t("made");
}

export function fillDealResult({ t, lang, result, last }) {
  const { contract } = result;
  const label = contractLabel(lang, contract);
  $("bridge-result-title").textContent =
    `${label} ${seatLetter(lang, contract.declarer)} ${resultMark(result)}`;
  $("bridge-result-line").textContent = `${t("resultLine", {
    contract: label,
    seat: seatName(lang, contract.declarer),
    result: resultWords(t, result)
  })} · ${t("tricksMade", { n: result.tricks })}`;
  const side = result.ns ? "sideNs" : "sideEw";
  const points = result.ns || result.ew;
  $("bridge-result-points").textContent = t("pointsFor", {
    side: t(side),
    points
  });
  $("bridge-deal-result").dataset.result = result.ns > 0 ? "win" : "loss";
  $("bridge-next-deal-button").textContent = t(
    last ? "matchResult" : "nextDeal"
  );
}

export function fillDiagram(host, deal, lang, trump) {
  host.replaceChildren();
  [0, 3, 1, 2].forEach((seat) => {
    const box = document.createElement("div");
    box.className = `br-diagram-hand br-diagram-${"nesw"[seat]}`;
    const title = document.createElement("p");
    title.className = "br-diagram-title";
    title.textContent = seatName(lang, seat);
    const lines = document.createElement("div");
    renderLines(lines, deal.hands[seat], { lang, trump });
    box.append(title, lines);
    host.append(box);
  });
}

function cell(row, text, tag = "td") {
  const el = document.createElement(tag);
  el.textContent = text;
  row.append(el);
}

export function fillScore(host, match, lang, t) {
  const table = document.createElement("table");
  const head = document.createElement("tr");
  ["colDeal", "colContract", "colResult", "colNs", "colEw"].forEach((key) =>
    cell(head, t(key), "th")
  );
  table.append(head);
  match.results.forEach((result, i) => {
    const row = document.createElement("tr");
    cell(row, String(i + 1));
    cell(
      row,
      `${contractLabel(lang, result.contract)} ${seatLetter(lang, result.contract.declarer)}`
    );
    cell(row, resultMark(result));
    cell(row, result.ns ? String(result.ns) : "");
    cell(row, result.ew ? String(result.ew) : "");
    table.append(row);
  });
  const sum = totals(match);
  const foot = document.createElement("tr");
  foot.className = "br-score-total";
  [t("total"), "", "", String(sum.ns), String(sum.ew)].forEach((text) =>
    cell(foot, text)
  );
  table.append(foot);
  host.replaceChildren(table);
}

export function fillMatchEnd(match, lang, t) {
  const sum = totals(match);
  const outcome = sum.ns > sum.ew ? "win" : sum.ns < sum.ew ? "loss" : "draw";
  const titles = { win: "matchWon", loss: "matchLost", draw: "matchDraw" };
  $("bridge-match-end").dataset.result = outcome;
  $("bridge-match-title").textContent = t(titles[outcome]);
  $("bridge-match-line").textContent = t("matchLine", sum);
  fillScore($("bridge-match-score"), match, lang, t);
}
