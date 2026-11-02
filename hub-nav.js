// Sticky hub bar: Home / All games switch and the search box (static markup
// in index.html). The input is never re-created, so typing keeps its focus
// while the list under it re-renders. On phones the search is a magnifier
// in the same row; it opens over the switch (`.is-searching`) and closes
// with × or when left empty.
import { MAX_QUERY_LENGTH } from "./hub-route.js";

const COPY = {
  fr: {
    home: "Accueil",
    all: "Tous les jeux",
    search: "Rechercher un jeu",
    close: "Fermer la recherche"
  },
  en: {
    home: "Home",
    all: "All games",
    search: "Search a game",
    close: "Close search"
  },
  es: {
    home: "Inicio",
    all: "Todos los juegos",
    search: "Buscar un juego",
    close: "Cerrar la búsqueda"
  }
};

function byId(id) {
  return document.getElementById(id);
}

function viewButtons() {
  return document.querySelectorAll(".hub-view[data-view]");
}

function setSearching(open) {
  byId("hub-nav")?.classList.toggle("is-searching", open);
  byId("hub-search-toggle")?.setAttribute("aria-expanded", String(open));
}

/** `onView("home" | "library")`, `onQuery(text)`. Call once. */
export function initNav({ onView, onQuery }) {
  viewButtons().forEach((button) =>
    button.addEventListener("click", () => onView(button.dataset.view))
  );
  const input = byId("hub-search-input");
  if (!input) return;
  input.maxLength = MAX_QUERY_LENGTH;
  input.addEventListener("input", () => onQuery(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  input.addEventListener("blur", () => {
    if (!input.value) setSearching(false);
  });
  byId("hub-search-toggle")?.addEventListener("click", () => {
    setSearching(true);
    input.focus();
  });
  // pointerdown keeps the input from blurring first, so one tap closes.
  const close = byId("hub-search-close");
  close?.addEventListener("pointerdown", (event) => event.preventDefault());
  close?.addEventListener("click", () => {
    if (input.value) onQuery("");
    input.blur();
    setSearching(false);
  });
}

export function renderNav({ lang, view, query, total }) {
  const copy = COPY[lang] || COPY.fr;
  viewButtons().forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    if (button.dataset.view === "home") {
      button.textContent = copy.home;
      return;
    }
    const count = document.createElement("span");
    count.className = "hub-view__count";
    count.textContent = ` (${total})`;
    button.replaceChildren(copy.all, count);
  });
  byId("hub-search-toggle")?.setAttribute("aria-label", copy.search);
  byId("hub-search-close")?.setAttribute("aria-label", copy.close);
  const input = byId("hub-search-input");
  if (!input) return;
  input.placeholder = copy.search;
  input.setAttribute("aria-label", copy.search);
  if (input.value !== query) input.value = query;
  if (query) setSearching(true);
  else if (document.activeElement !== input) setSearching(false);
}
