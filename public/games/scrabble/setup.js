// Choice buttons ([data-setting][data-value]) on the start screen and in the
// options panel, the players and level sliders, the level's record, the
// player names, the resume button.
import { LEVEL_IDS } from "./ai.js";
import { CHOICES, cleanName, NAME_SLOTS, PLAYER_COUNTS } from "./store.js";
import { tileSetFor, useJunior, useTileSet } from "./tiles.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const NAME_IDS = Array.from(
  { length: NAME_SLOTS },
  (_, p) => `scrabble-name-${p + 1}`
);
const SLIDERS = {
  players: { id: "scrabble-players-slider", values: PLAYER_COUNTS },
  level: { id: "scrabble-level-slider", values: LEVEL_IDS }
};

// Word buttons are ticks (several languages at once); the others pick one.
export function bindChoices(onChoose, onNames) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
      const { setting, value } = button.dataset;
      if (setting === "words") return onChoose(setting, value);
      const choice = CHOICES[setting]?.find((c) => String(c) === value);
      if (choice !== undefined) onChoose(setting, choice);
    });
  });
  Object.entries(SLIDERS).forEach(([setting, { id, values }]) =>
    $(id).addEventListener("input", (event) => {
      const value = values[Number(event.target.value)];
      if (value !== undefined) onChoose(setting, value);
    })
  );
  NAME_IDS.forEach((id) =>
    $(id).addEventListener("input", () =>
      onNames(NAME_IDS.map((n) => cleanName($(n).value)))
    )
  );
}

const isOn = (current, value) =>
  Array.isArray(current) ? current.includes(value) : String(current) === value;

export function renderChoices(settings) {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    const on = isOn(settings[button.dataset.setting], button.dataset.value);
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  const solo = settings.players === 1;
  const only = "[data-solo-only], [data-group-only], [data-mix-only]";
  document.querySelectorAll(only).forEach((node) => {
    const { soloOnly, groupOnly, mixOnly } = node.dataset;
    node.hidden =
      (soloOnly !== undefined && !solo) ||
      (groupOnly !== undefined && solo) ||
      (mixOnly !== undefined && settings.words.length < 2);
  });
  NAME_IDS.forEach((id, p) => {
    const input = $(id);
    input.hidden = p >= settings.players;
    if (document.activeElement !== input) input.value = settings.names[p];
  });
}

function paintSlider(setting, value) {
  const { id, values } = SLIDERS[setting];
  const index = Math.max(0, values.indexOf(value));
  const slider = $(id);
  slider.value = String(index);
  slider.style.setProperty("--fill", index / (values.length - 1));
  return slider;
}

// Players slider and its caption (against the computer / n on one device).
export function renderPlayers(players, t) {
  const caption =
    players === 1 ? t("vsComputer") : t("onOneDevice", { n: players });
  paintSlider("players", players).setAttribute("aria-valuetext", caption);
  $("scrabble-players-caption").textContent = caption;
}

// Level slider, its colour and the record of the selected level.
export function renderLevel(level, stats, t) {
  const slider = paintSlider("level", level);
  slider.setAttribute("aria-valuetext", t(level));
  slider.closest(".sc-slider").dataset.level = level;
  const { won, played } = stats[level];
  $("scrabble-level-record").textContent = played
    ? t("levelRecord", { won, played })
    : t("noRecord");
}

export const renderResume = (saved) => {
  $("scrabble-resume-button").hidden = !saved;
};

export const isJunior = (config) =>
  config.players === 1 && config.level === "junior";

// Racks in the match: solo is you and the computer.
export const seatsOf = (config) => Math.max(2, config.players);

// Tile set and board of a match: word languages, then Junior or classic.
export function useRules(config) {
  useTileSet(tileSetFor(config.words));
  useJunior(isJunior(config));
}

export const matchConfig = (settings) => ({
  players: settings.players,
  level: settings.level,
  words: settings.words.slice(),
  names: settings.names.slice()
});
