// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, per-level records and the resume button.
import { LEVEL_IDS } from "./ai.js";
import { CHOICES } from "./store.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function bindChoices(onChoose) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
      const { setting, value } = button.dataset;
      if (CHOICES[setting]?.includes(value)) onChoose(setting, value);
    });
  });
}

export function renderChoices(settings) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    const on = settings[button.dataset.setting] === button.dataset.value;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-solo-only]").forEach((node) => {
    node.hidden = settings.mode !== "solo";
  });
}

export function renderRecords(stats, t) {
  LEVEL_IDS.forEach((id) => {
    const { won, played } = stats[id];
    const line = $(`checkers-level-${id}`).querySelector("[data-level-record]");
    line.textContent = played
      ? t("levelRecord", { won, played })
      : t("noRecord");
  });
}

export function renderResume(saved) {
  $("checkers-resume-button").hidden = !saved;
}

// Turns the settings into one match's config; "random" picks the side now.
export function matchConfig(settings) {
  const side =
    settings.color === "random"
      ? Math.random() < 0.5
        ? 1
        : -1
      : settings.color === "dark"
        ? -1
        : 1;
  return {
    mode: settings.mode,
    level: settings.level,
    variant: settings.variant,
    side
  };
}
