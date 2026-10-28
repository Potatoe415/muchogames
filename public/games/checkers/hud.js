// Player bars above and below the board, and the action buttons' state.
import { countPieces, DARK, LIGHT, squareNumber } from "./rules.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export const notation = (move) =>
  `${squareNumber(move.from)}${move.captures.length ? "×" : "-"}${squareNumber(move.to)}`;

function barName(config, side, t) {
  if (config.mode === "duo") return t(side === LIGHT ? "light" : "dark");
  return side === config.side
    ? t("you")
    : t("computer", { level: t(config.level) });
}

function barStatus(match, side, info, over, t) {
  if (!over && match.turn === side) {
    if (info.thinking) return t("thinking");
    return info.mustCapture ? t("mustCapture") : t("toPlay");
  }
  const last = match.moveBy(side);
  return last ? t("lastMove", { move: notation(last) }) : "";
}

function renderBar(id, side, { match, config, info, over, t }) {
  const bar = $(id);
  bar.classList.toggle("is-active", !over && match.turn === side);
  bar.classList.toggle(
    "is-thinking",
    !over && match.turn === side && info.thinking
  );
  bar.querySelector("[data-bar-disc]").className =
    `ck-disc ${side === LIGHT ? "is-light" : "is-dark"}`;
  bar.querySelector("[data-bar-name]").textContent = barName(config, side, t);
  bar.querySelector("[data-bar-pieces]").textContent = t(
    "pieces",
    countPieces(match.board, side)
  );
  bar.querySelector("[data-bar-status]").textContent = barStatus(
    match,
    side,
    info,
    over,
    t
  );
}

// state: { match, config, info, over, t }
export function renderHud(state) {
  const bottom = state.config.mode === "solo" ? state.config.side : LIGHT;
  renderBar("checkers-player-bottom", bottom, state);
  renderBar("checkers-player-top", bottom === LIGHT ? DARK : LIGHT, state);
  $("checkers-undo-button").disabled = !state.info.canUndo;
  $("checkers-hint-button").disabled = !state.info.canHint;
}
