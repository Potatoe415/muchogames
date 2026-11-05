// Home view: horizontal rows of small square tiles. Most played (or newest
// when no launch is counted yet), then Recent, Favorites and Featured (each only when it has games), then Quick games and one row
// per type. "See all" opens the library with that row's filter.
import {
  EMPTY_FILTERS,
  TYPES,
  tagLabel,
  timeOf,
  typesOf
} from "./hub-taxonomy.js";

const COPY = {
  fr: {
    top_popular: "Les plus joués",
    top_recent: "Nouveautés",
    recent: "Récents",
    favorites: "Favoris",
    featured: "À la une",
    quick: "⚡ Parties rapides",
    more: "Tout voir"
  },
  en: {
    top_popular: "Most played",
    top_recent: "New games",
    recent: "Recently played",
    favorites: "Favorites",
    featured: "Featured",
    quick: "⚡ Quick games",
    more: "See all"
  },
  es: {
    top_popular: "Los más jugados",
    top_recent: "Novedades",
    recent: "Recientes",
    favorites: "Favoritos",
    featured: "Destacados",
    quick: "⚡ Partidas rápidas",
    more: "Ver todo"
  }
};

/**
 * `rows` holds the per-browser / admin lists: { recent, favorites, featured }.
 * `sorted` is every visible game in the hub's current sort order.
 */
function homeRows(sorted, rows, copy, lang) {
  return [
    { key: "top", title: copy[`top_${rows.top.mode}`], games: rows.top.games },
    { key: "recent", title: copy.recent, games: rows.recent },
    {
      key: "favorites",
      title: copy.favorites,
      games: rows.favorites,
      filters: { fav: true }
    },
    { key: "featured", title: copy.featured, games: rows.featured },
    {
      key: "quick",
      title: copy.quick,
      games: sorted.filter((game) => timeOf(game) === "rapide"),
      filters: { time: "rapide" }
    },
    ...TYPES.map((type) => ({
      key: type,
      title: tagLabel(type, lang),
      games: sorted.filter((game) => typesOf(game).includes(type)),
      filters: { type }
    }))
  ].filter((row) => row.games.length > 0);
}

function createRowHead(row, copy, onSeeAll) {
  const head = document.createElement("div");
  head.className = "hub-row__head";
  const title = document.createElement("h2");
  title.className = "hub-row__title";
  title.textContent = row.title;
  head.appendChild(title);
  if (!row.filters) return head;

  const more = document.createElement("button");
  more.type = "button";
  more.className = "hub-row__more";
  more.dataset.id = `hub-home-more-${row.key}`;
  more.textContent = `${copy.more} (${row.games.length}) ›`;
  more.addEventListener("click", () =>
    onSeeAll({ ...EMPTY_FILTERS, ...row.filters })
  );
  head.appendChild(more);
  return head;
}

export function renderHome(container, { sorted, rows, lang, tile, onSeeAll }) {
  const copy = COPY[lang] || COPY.fr;
  const fragment = document.createDocumentFragment();
  homeRows(sorted, rows, copy, lang).forEach((row) => {
    const section = document.createElement("section");
    section.className = "hub-row";
    section.dataset.id = `hub-home-${row.key}`;
    const track = document.createElement("div");
    track.className = "hub-row__track";
    row.games.forEach((game) => track.appendChild(tile(game, row.key)));
    section.append(createRowHead(row, copy, onSeeAll), track);
    fragment.appendChild(section);
  });
  container.replaceChildren(fragment);
}
