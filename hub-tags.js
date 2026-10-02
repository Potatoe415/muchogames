// Player-count / duration tags on hub tiles and the "how many are we?"
// filter. Both read optional `players: [min, max]` and `duration` (minutes)
// fields of public/hub-config.json; a game without them shows no tag and is
// never hidden by the filter.
const FILTERS = [
  { id: "any" },
  { id: "1", count: 1 },
  { id: "2", count: 2 },
  { id: "4", count: 4 },
  { id: "6", count: 6, orMore: true }
];

const COPY = {
  fr: {
    label: "On est",
    any: "Peu importe",
    1: "Seul",
    2: "2",
    4: "4",
    6: "6 et +",
    empty: "Aucun jeu pour ce nombre de joueurs dans cette catégorie.",
    minutes: "min"
  },
  en: {
    label: "Players",
    any: "Any",
    1: "Solo",
    2: "2",
    4: "4",
    6: "6+",
    empty: "No game for this many players in this category.",
    minutes: "min"
  },
  es: {
    label: "Somos",
    any: "Da igual",
    1: "Solo",
    2: "2",
    4: "4",
    6: "6 o más",
    empty: "Ningún juego para tantos jugadores en esta categoría.",
    minutes: "min"
  }
};

function readPlayers(game) {
  const players = game.players;
  if (!Array.isArray(players) || players.length !== 2) return null;
  const [min, max] = players.map(Number);
  return Number.isInteger(min) && Number.isInteger(max) && min <= max
    ? { min, max }
    : null;
}

export function matchesPlayerFilter(game, filterId) {
  const filter = FILTERS.find((option) => option.id === filterId);
  const players = readPlayers(game);
  if (!filter?.count || !players) return true;
  if (filter.orMore) return players.max >= filter.count;
  return players.min <= filter.count && filter.count <= players.max;
}

export function playerFilterEmptyMessage(lang) {
  return (COPY[lang] || COPY.fr).empty;
}

export function renderPlayerFilter(container, activeId, lang, onSelect) {
  if (!container) return;
  const copy = COPY[lang] || COPY.fr;
  container.replaceChildren();

  const label = document.createElement("span");
  label.className = "player-filter__label";
  label.textContent = copy.label;
  container.appendChild(label);

  FILTERS.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `player-filter__option${option.id === activeId ? " is-active" : ""}`;
    button.dataset.id = `hub-player-filter-${option.id}`;
    button.setAttribute("aria-pressed", String(option.id === activeId));
    button.textContent = copy[option.id];
    button.addEventListener("click", () => onSelect(option.id));
    container.appendChild(button);
  });
}

export function createTileTags(game, lang) {
  const copy = COPY[lang] || COPY.fr;
  const players = readPlayers(game);
  const duration = Number(game.duration);
  const chips = [];
  if (players) {
    chips.push(
      `👥 ${players.min === players.max ? players.min : `${players.min}–${players.max}`}`
    );
  }
  if (Number.isInteger(duration) && duration > 0) {
    chips.push(`⏱ ${duration} ${copy.minutes}`);
  }
  if (chips.length === 0) return null;

  const wrap = document.createElement("div");
  wrap.className = "game-tile__tags";
  chips.forEach((text) => {
    const chip = document.createElement("span");
    chip.className = "game-tile__tag";
    chip.textContent = text;
    wrap.appendChild(chip);
  });
  return wrap;
}
