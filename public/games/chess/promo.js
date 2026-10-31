// Promotion picker: queen, rook, bishop or knight. Resolves with the chosen
// piece type, or 0 when the player backs out (backdrop, Cancel, Escape).
import { paintGlyph } from "./view.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

let close = null;

export function cancelPromotion() {
  close?.(0);
}

export function askPromotion(side) {
  cancelPromotion();
  const overlay = $("chess-promotion");
  const buttons = [...overlay.querySelectorAll("[data-promo]")];
  buttons.forEach((button) =>
    paintGlyph(
      button.querySelector("[data-promo-glyph]"),
      side * Number(button.dataset.promo)
    )
  );
  overlay.hidden = false;
  buttons[0].focus();
  return new Promise((resolve) => {
    const onClick = (event) => {
      const choice = event.target.closest("[data-promo]");
      if (choice) close(Number(choice.dataset.promo));
      else if (
        event.target === overlay ||
        event.target.closest("[data-promo-cancel]")
      )
        close(0);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close(0);
    };
    close = (type) => {
      close = null;
      overlay.hidden = true;
      overlay.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      resolve(type);
    };
    overlay.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
  });
}
