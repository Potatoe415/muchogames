// "All games" library: one-line pill bar (one value per axis, axes combine)
// and a compact list of the matching games.
import {
  activeFilterCount,
  EMPTY_FILTERS,
  tagLabel,
  TYPES
} from "./hub-taxonomy.js";

const COPY = {
  fr: {
    all: "Tous",
    fav: "★ Favoris",
    count: (n) => `${n} jeu${n > 1 ? "x" : ""}`,
    empty: "Aucun jeu ne correspond.",
    clear: "Effacer les filtres"
  },
  en: {
    all: "All",
    fav: "★ Favorites",
    count: (n) => `${n} game${n > 1 ? "s" : ""}`,
    empty: "No game matches.",
    clear: "Clear filters"
  },
  es: {
    all: "Todos",
    fav: "★ Favoritos",
    count: (n) => `${n} juego${n > 1 ? "s" : ""}`,
    empty: "Ningún juego coincide.",
    clear: "Borrar filtros"
  }
};

const PILLS = [
  { axis: "time", value: "rapide" },
  ...TYPES.map((value) => ({ axis: "type", value })),
  { axis: "players", value: "solo" },
  { axis: "players", value: "duo" },
  { axis: "players", value: "groupe" },
  { axis: "time", value: "moyen" },
  { axis: "time", value: "long" }
];

function createPill(dataId, label, active, onClick) {
  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = `hub-pill${active ? " is-active" : ""}`;
  pill.dataset.id = dataId;
  pill.setAttribute("aria-pressed", String(active));
  pill.textContent = label;
  pill.addEventListener("click", onClick);
  return pill;
}

/** `onChange(nextFilters)` gets the filters after the tap. */
export function renderPills(container, { filters, lang, onChange }) {
  const copy = COPY[lang] || COPY.fr;
  const none = activeFilterCount(filters) === 0;
  const pills = [
    createPill("hub-pill-all", copy.all, none, () =>
      onChange({ ...EMPTY_FILTERS })
    ),
    createPill("hub-pill-fav", copy.fav, filters.fav, () =>
      onChange({ ...filters, fav: !filters.fav })
    ),
    ...PILLS.map(({ axis, value }) =>
      createPill(
        `hub-pill-${value}`,
        tagLabel(value, lang),
        filters[axis] === value,
        () =>
          onChange({ ...filters, [axis]: filters[axis] === value ? "" : value })
      )
    )
  ];
  container.replaceChildren(...pills);
}

function createSummary(count, narrowed, copy, onClear) {
  const summary = document.createElement("div");
  summary.className = "hub-library__summary";
  const text = document.createElement("span");
  text.dataset.id = "hub-library-count";
  text.textContent = copy.count(count);
  summary.appendChild(text);
  if (narrowed) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "hub-library__clear";
    clear.dataset.id = "hub-library-clear";
    clear.textContent = copy.clear;
    clear.addEventListener("click", onClear);
    summary.appendChild(clear);
  }
  return summary;
}

/** `narrowed`: a filter or a search is active, so "Clear" is offered. */
export function renderLibrary(
  container,
  { games, narrowed, lang, row, onClear }
) {
  const copy = COPY[lang] || COPY.fr;
  const list = document.createElement("div");
  list.className = "hub-library__list";
  list.dataset.id = "hub-library-list";
  games.forEach((game) => list.appendChild(row(game)));

  const parts = [createSummary(games.length, narrowed, copy, onClear)];
  if (games.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hub-library__empty";
    empty.dataset.id = "hub-games-empty";
    empty.textContent = copy.empty;
    parts.push(empty);
  } else {
    parts.push(list);
  }
  container.replaceChildren(...parts);
}
