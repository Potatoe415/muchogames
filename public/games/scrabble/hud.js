// Score cards, bag counter, the one-line guide under them and the action
// buttons' state. The guide always says the single most useful thing now.
import { isBoardEmpty } from "./rules.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function lastMoveLine(game, names, t) {
  const last = game.history.at(-1);
  if (!last) return "";
  const name = names[last.p];
  if (last.kind === "play")
    return t("lastPlay", { name, word: last.word, score: last.score });
  if (last.kind === "swap") return t("lastSwap", { name, count: last.count });
  return t("lastPass", { name });
}

function previewLine({ preview }, t) {
  if (preview.tone === "error") return t(`err_${preview.error}`);
  if (preview.tone === "bad")
    return t("badWord", { word: preview.bad.join(", ") });
  const words = preview.analysis.words.map((w) => w.text).join(", ");
  const line = t("okWord", { words, score: preview.score });
  return preview.analysis.bingo ? `${line} · ${t("bingo")}` : line;
}

function guide(s, ctx) {
  const { game, names, t, solo } = ctx;
  if (s.lookup) return [t("lookupHint"), "ok"];
  if (s.thinking) return [t("thinking", { name: names[1] }), "wait"];
  if (s.notice) return [t(s.notice), "error"];
  if (s.preview.tone !== "idle") return [previewLine(s, t), s.preview.tone];
  const last = lastMoveLine(game, names, t);
  if (isBoardEmpty(game.board)) return [t("firstTurn"), "idle"];
  if (last) return [last, "idle"];
  return [
    solo ? t("yourTurn") : t("turnOf", { name: names[game.turn] }),
    "idle"
  ];
}

// One card per rack (2 to 4); the unused cards are hidden.
function paintPlayers(game, { names, junior }, thinking) {
  const seats = game.racks.length;
  $("scrabble-scores").dataset.players = String(seats);
  document.querySelectorAll("[data-player-card]").forEach((card, p) => {
    card.hidden = p >= seats;
    if (p >= seats) return;
    card.classList.toggle("is-active", !game.over && game.turn === p);
    card.classList.toggle("is-thinking", thinking && game.turn === p);
    card.querySelector("[data-name]").textContent = names[p];
    card.querySelector("[data-score]").textContent = String(game.scores[p]);
    const peek = card.querySelector("[data-rack-peek]");
    peek.textContent = junior && p === 1 ? rackText(game.racks[1]) : "";
  });
}

// Junior racks are face up: the computer's letters show under its name.
const rackText = (rack) => rack.map((l) => (l === "?" ? "☆" : l)).join(" ");

// s: play state; ctx: { game, names, t, solo, junior, canAct, hints }
export function renderHud(s, ctx) {
  const { game, t, canAct } = ctx;
  paintPlayers(game, ctx, s.thinking);
  $("scrabble-bag-count").textContent = String(game.bag.length);
  const [text, tone] = guide(s, ctx);
  const info = $("scrabble-info");
  info.textContent = text;
  info.dataset.tone = tone;
  const drafting = s.draft.length > 0;
  $("scrabble-shuffle-button").hidden = drafting;
  $("scrabble-recall-button").hidden = !drafting;
  $("scrabble-hint-button").hidden = !ctx.hints;
  const define = $("scrabble-define-button");
  define.disabled = s.hidden;
  define.classList.toggle("active", s.lookup);
  define.setAttribute("aria-pressed", String(s.lookup));
  ["shuffle", "recall", "hint", "pass"].forEach((name) => {
    $(`scrabble-${name}-button`).disabled = !canAct;
  });
  const play = $("scrabble-play-button");
  play.disabled = !canAct || s.preview.tone !== "ok";
  play.querySelector("[data-play-score]").textContent =
    s.preview.tone === "ok" || s.preview.tone === "bad"
      ? `+${s.preview.score}`
      : "";
  play.querySelector("[data-play-label]").textContent = t("playWord");
}
