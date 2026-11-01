// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, the level slider and its record, the two player names, the
// resume button.
import { LEVEL_IDS } from "./ai.js";
import { CHOICES, cleanName } from "./store.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const NAME_IDS = ["scrabble-name-1", "scrabble-name-2"];

export function bindChoices(onChoose, onNames) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
      const { setting, value } = button.dataset;
      if (CHOICES[setting]?.includes(value)) onChoose(setting, value);
    });
  });
  $("scrabble-level-slider").addEventListener("input", (event) => {
    const level = LEVEL_IDS[Number(event.target.value)];
    if (level) onChoose("level", level);
  });
  NAME_IDS.forEach((id) =>
    $(id).addEventListener("input", () =>
      onNames(NAME_IDS.map((n) => cleanName($(n).value)))
    )
  );
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
  document.querySelectorAll("[data-duo-only]").forEach((node) => {
    node.hidden = settings.mode !== "duo";
  });
  document.querySelectorAll("[data-mix-only]").forEach((node) => {
    node.hidden = settings.words !== "fr-es";
  });
  NAME_IDS.forEach((id, p) => {
    if (document.activeElement !== $(id)) $(id).value = settings.names[p];
  });
}

// Slider position, its colour and the record of the selected level.
export function renderLevel(level, stats, t) {
  const index = Math.max(0, LEVEL_IDS.indexOf(level));
  const slider = $("scrabble-level-slider");
  slider.value = String(index);
  slider.setAttribute("aria-valuetext", t(level));
  slider.closest(".sc-slider").dataset.level = level;
  slider.style.setProperty("--fill", index / (LEVEL_IDS.length - 1));
  const { won, played } = stats[level];
  $("scrabble-level-record").textContent = played
    ? t("levelRecord", { won, played })
    : t("noRecord");
}

export const renderResume = (saved) => {
  $("scrabble-resume-button").hidden = !saved;
};

export const matchConfig = (settings) => ({
  mode: settings.mode,
  level: settings.level,
  words: settings.words,
  p1Lang: settings.p1Lang,
  names: settings.names.slice()
});
