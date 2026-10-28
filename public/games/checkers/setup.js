// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, the level slider and its record line, the resume button.
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
  $("checkers-level-slider").addEventListener("input", (event) => {
    const level = LEVEL_IDS[Number(event.target.value)];
    if (level) onChoose("level", level);
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

// Slider position, its colour band and the record of the selected level.
export function renderLevel(level, stats, t) {
  const index = Math.max(0, LEVEL_IDS.indexOf(level));
  const slider = $("checkers-level-slider");
  slider.value = String(index);
  slider.setAttribute("aria-valuetext", t(level));
  slider.closest(".ck-slider").dataset.level = level;
  slider.style.setProperty("--fill", index / (LEVEL_IDS.length - 1));
  const { won, played } = stats[level];
  $("checkers-level-record").textContent = played
    ? t("levelRecord", { won, played })
    : t("noRecord");
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
