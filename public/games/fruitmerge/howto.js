// "How to play" dialog: one tip per page with a small fruit illustration,
// page dots, previous / OK / next. Shown before the very first match and
// from the start screen.
import { LAST } from "./fruits.js";
import { paintIcon } from "./sprites.js";

const EVOLUTION = Array.from({ length: LAST + 1 }, (_, level) => level);
// Numbers are fruit levels, strings are glyphs.
const ART = [
  ["↔", 3, "↓"],
  [0, "+", 0, "→", 1],
  [7, 8, 6, "⚠️"],
  ["🧹", 0, 1, 0],
  ["↶", 4],
  [LAST, "+", LAST, "→", "✨"],
  [1, 0, 2],
  EVOLUTION
];

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function artNode(item) {
  if (typeof item === "string") {
    const span = document.createElement("span");
    span.className = "fm-howto-glyph";
    span.textContent = item;
    return span;
  }
  const canvas = document.createElement("canvas");
  canvas.className = "fm-howto-fruit";
  canvas.dataset.level = String(item);
  return canvas;
}

export function createHowto({ t, tips, onClose }) {
  const overlay = $("fruitmerge-howto");
  const art = $("fruitmerge-howto-art");
  let page = 0;

  function render() {
    const list = tips();
    const items = ART[page];
    art.classList.toggle("is-row", items === EVOLUTION);
    art.replaceChildren(...items.map(artNode));
    art.querySelectorAll("canvas").forEach((canvas) => {
      paintIcon(canvas, Number(canvas.dataset.level));
    });
    $("fruitmerge-howto-text").textContent = list[page];
    const dots = $("fruitmerge-howto-dots");
    dots.replaceChildren(
      ...list.map((_, i) => {
        const dot = document.createElement("span");
        dot.className = i === page ? "fm-dot is-on" : "fm-dot";
        return dot;
      })
    );
    dots.setAttribute(
      "aria-label",
      t("page", { n: page + 1, total: list.length })
    );
    $("fruitmerge-howto-prev").disabled = page === 0;
    $("fruitmerge-howto-next").disabled = page === list.length - 1;
  }

  function go(step) {
    page = Math.max(0, Math.min(ART.length - 1, page + step));
    render();
  }

  $("fruitmerge-howto-prev").addEventListener("click", () => go(-1));
  $("fruitmerge-howto-next").addEventListener("click", () => go(1));
  $("fruitmerge-howto-ok").addEventListener("click", () => {
    overlay.hidden = true;
    onClose();
  });

  return {
    open() {
      page = 0;
      overlay.hidden = false;
      render();
    },
    render() {
      if (!overlay.hidden) render();
    },
    isOpen: () => !overlay.hidden
  };
}
