// Sticky hub bar: Home / All games switch and the search box (static markup
// in index.html). The input is never re-created, so typing keeps its focus
// while the list under it re-renders.
import { MAX_QUERY_LENGTH } from "./hub-route.js";

const COPY = {
  fr: { home: "Accueil", all: "Tous les jeux", search: "Rechercher un jeu" },
  en: { home: "Home", all: "All games", search: "Search a game" },
  es: { home: "Inicio", all: "Todos los juegos", search: "Buscar un juego" }
};

function searchInput() {
  return document.getElementById("hub-search-input");
}

function viewButtons() {
  return document.querySelectorAll(".hub-view[data-view]");
}

/** `onView("home" | "library")`, `onQuery(text)`. Call once. */
export function initNav({ onView, onQuery }) {
  viewButtons().forEach((button) =>
    button.addEventListener("click", () => onView(button.dataset.view))
  );
  const input = searchInput();
  if (!input) return;
  input.maxLength = MAX_QUERY_LENGTH;
  input.addEventListener("input", () => onQuery(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
}

export function renderNav({ lang, view, query, total }) {
  const copy = COPY[lang] || COPY.fr;
  viewButtons().forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent =
      button.dataset.view === "home" ? copy.home : `${copy.all} (${total})`;
  });
  const input = searchInput();
  if (!input) return;
  input.placeholder = copy.search;
  input.setAttribute("aria-label", copy.search);
  if (input.value !== query) input.value = query;
}
