const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function chip({ id, key, label, on }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = on ? "memory-chip is-selected" : "memory-chip";
  button.dataset.id = id;
  button.setAttribute("aria-pressed", on ? "true" : "false");
  if (key) button.dataset.i18n = key;
  button.textContent = label;
  return button;
}

function fill(id, buttons) {
  const host = $(id);
  host.replaceChildren(...buttons);
}

function mountModes(setup) {
  fill("memory-mode-list", [
    chip({
      id: "memory-mode-solo",
      key: "solo",
      label: "Solo",
      on: setup.mode === "solo"
    }),
    chip({
      id: "memory-mode-pass",
      key: "pass",
      label: "2 joueurs",
      on: setup.mode === "pass"
    }),
    chip({
      id: "memory-mode-bot",
      key: "bot",
      label: "Robot",
      on: setup.mode === "bot"
    })
  ]);
}

function mountLevels(setup) {
  fill("memory-level-list", [
    chip({
      id: "memory-level-easy",
      key: "easy",
      label: "Facile",
      on: setup.difficulty === "easy"
    }),
    chip({
      id: "memory-level-medium",
      key: "medium",
      label: "Moyen",
      on: setup.difficulty === "medium"
    }),
    chip({
      id: "memory-level-hard",
      key: "hard",
      label: "Difficile",
      on: setup.difficulty === "hard"
    })
  ]);
}

function mountGrids(setup) {
  fill("memory-grid-list", [
    chip({ id: "memory-grid-4x4", label: "4×4", on: setup.grid === "4x4" }),
    chip({ id: "memory-grid-4x6", label: "4×6", on: setup.grid === "4x6" }),
    chip({ id: "memory-grid-6x6", label: "6×6", on: setup.grid === "6x6" })
  ]);
}

export function mountChips(setup) {
  mountModes(setup);
  mountLevels(setup);
  mountGrids(setup);
}
