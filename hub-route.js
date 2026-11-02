// Hub view state <-> URL query, so a filtered library can be shared and the
// phone's Back button returns to the previous view or filter.
// `?view=all&type=cartes&time=rapide&players=solo&fav=1&q=ski`; no params is
// the Home view. Other params (`_refresh`, ...) are left alone.
import { AXES, EMPTY_FILTERS } from "./hub-taxonomy.js";

const VIEW_ALL = "all";
const MAX_QUERY_LENGTH = 60;
const KEYS = ["view", "q", "fav", ...Object.keys(AXES)];

export function readRoute(search = window.location.search) {
  const params = new URLSearchParams(search);
  const filters = { ...EMPTY_FILTERS, fav: params.get("fav") === "1" };
  Object.entries(AXES).forEach(([axis, values]) => {
    const value = params.get(axis) || "";
    filters[axis] = values.includes(value) ? value : "";
  });
  return {
    view: params.get("view") === VIEW_ALL ? "library" : "home",
    query: (params.get("q") || "").slice(0, MAX_QUERY_LENGTH),
    filters
  };
}

function routeUrl(route) {
  const url = new URL(window.location.href);
  KEYS.forEach((key) => url.searchParams.delete(key));
  if (route.view === "library") {
    url.searchParams.set("view", VIEW_ALL);
    Object.keys(AXES).forEach((axis) => {
      if (route.filters[axis]) url.searchParams.set(axis, route.filters[axis]);
    });
    if (route.filters.fav) url.searchParams.set("fav", "1");
    if (route.query) url.searchParams.set("q", route.query);
  }
  return url.toString();
}

/** `replace` for typing in the search box: one history entry per search. */
export function writeRoute(route, { replace = false } = {}) {
  const url = routeUrl(route);
  if (url === window.location.href) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export function onRouteChange(callback) {
  window.addEventListener("popstate", () => callback(readRoute()));
}
