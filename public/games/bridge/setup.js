// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, the level slider and its record line, the resume button.
import { LEVEL_IDS } from "./play-ai.js";
import { CHOICES } from "./store.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const ON_OFF = [
  ["on", "on"],
  ["off", "off"]
];
// [setting, title key, [value, label key] …] for the options panel.
const OPTION_SECTIONS = [
  ["sound", "sound", ON_OFF],
  [
    "speed",
    "speed",
    [
      ["slow", "slow"],
      ["normal", "normal"],
      ["fast", "fast"]
    ]
  ],
  ["hints", "hintOption", ON_OFF],
  ["autoplay", "autoplay", ON_OFF],
  [
    "deck",
    "deck",
    [
      ["two", "deckTwo"],
      ["four", "deckFour"]
    ]
  ],
  ["openHands", "openHands", ON_OFF]
];

const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function element(tag, className) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function optionSection([setting, title, values]) {
  const section = element("div", "options-panel-section");
  section.dataset.id = `bridge-options-${kebab(setting)}`;
  const heading = element("p", "options-panel-section-title");
  heading.dataset.i18n = title;
  const chips = element("div", "br-chips");
  values.forEach(([value, label]) => {
    const button = element("button", "br-chip");
    button.type = "button";
    Object.assign(button.dataset, {
      setting,
      value,
      id: `bridge-${kebab(setting)}-${value}`,
      i18n: label
    });
    chips.append(button);
  });
  section.append(heading, chips);
  return section;
}

// The game's own options, between Language and Rules.
export function buildOptions() {
  $("bridge-options-settings").replaceWith(
    ...OPTION_SECTIONS.map(optionSection)
  );
}

export function bindChoices(onChoose) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
      const { setting, value } = button.dataset;
      if (CHOICES[setting]?.includes(value)) onChoose(setting, value);
    });
  });
  $("bridge-level-slider").addEventListener("input", (event) => {
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
}

export function renderLevel(level, stats, t) {
  const index = Math.max(0, LEVEL_IDS.indexOf(level));
  const slider = $("bridge-level-slider");
  slider.value = String(index);
  slider.setAttribute("aria-valuetext", t(level));
  slider.closest(".br-slider").dataset.level = level;
  slider.style.setProperty("--fill", index / (LEVEL_IDS.length - 1));
  const { won, played } = stats[level];
  $("bridge-level-record").textContent = played
    ? t("levelRecord", { won, played })
    : t("noRecord");
}

export function renderResume(saved) {
  $("bridge-resume-button").hidden = !saved;
}
