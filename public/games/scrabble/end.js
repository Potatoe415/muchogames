// The end card: result, why the match ended, each player's final score with
// the end-of-game rack adjustment, and their best word.
import { bestPlay } from "./game.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function title(winner, { solo, names, t }) {
  if (winner < 0) return t("draw");
  if (solo) return t(winner === 0 ? "win" : "loss");
  return t("nameWins", { name: names[winner] });
}

function lines(game, { names, t }) {
  return [0, 1].flatMap((p) => {
    const adjust = game.over.adjust[p];
    const signed = adjust > 0 ? `+${adjust}` : String(adjust);
    const score = game.scores[p];
    const best = bestPlay(game, p);
    const line = t("endPlayer", { name: names[p], score, adjust: signed });
    const rows = [{ text: line, className: "sc-end-score" }];
    if (best) {
      const text = t("bestWord", { word: best.word, score: best.score });
      rows.push({ text, className: "sc-end-best" });
    }
    return rows;
  });
}

// ctx: { solo, names: [a, b], t }
export function renderEnd(game, ctx) {
  if (!game?.over) return;
  const { winner, reason } = game.over;
  const out = game.racks.findIndex((rack) => !rack.length);
  const result = ctx.solo ? ["win", "loss"][winner] || "draw" : "win";
  $("scrabble-end").dataset.result = result;
  $("scrabble-end-title").textContent = title(winner, ctx);
  $("scrabble-end-reason").textContent =
    reason === "out"
      ? ctx.t("endOut", { name: ctx.names[out] })
      : ctx.t("endBlocked");
  $("scrabble-end-lines").replaceChildren(
    ...lines(game, ctx).map(({ text, className }) => {
      const p = document.createElement("p");
      p.className = className;
      p.textContent = text;
      return p;
    })
  );
}
