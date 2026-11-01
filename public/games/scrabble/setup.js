// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, the two player names, the level record, the resume button.
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
  NAME_IDS.forEach((id, p) => {
    if (document.activeElement !== $(id)) $(id).value = settings.names[p];
  });
}

export function renderLevel(level, stats, t) {
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
  names: settings.names.slice()
});
