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

// The language tag (FR / ES) shows only when the two players differ.
function paintPlayers(game, { names, langs }, thinking) {
  const mixed = langs[0] !== langs[1];
  [0, 1].forEach((p) => {
    const card = $(`scrabble-player-${p + 1}`);
    card.classList.toggle("is-active", !game.over && game.turn === p);
    card.classList.toggle("is-thinking", thinking && game.turn === p);
    card.querySelector("[data-name]").textContent = names[p];
    card.querySelector("[data-word-lang]").textContent = mixed
      ? langs[p].toUpperCase()
      : "";
    card.querySelector("[data-score]").textContent = String(game.scores[p]);
  });
}

// s: play state; ctx: { game, names, langs, t, solo, canAct, hints }
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
